'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  Calendar,
  Clock,
  MapPin,
  Phone,
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
  Package,
  Shield,
  Key,
} from 'lucide-react';

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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting Advance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  ADVANCE_PAID: { label: 'Booking Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  DELIVERED: { label: 'Delivered', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  IN_USE: { label: 'In Use', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  RETURNED: { label: 'Returned', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
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

  const fetchStaffOperators = async () => {
    try {
      const res = await fetch('/api/vendor/staff/drivers');
      const data = await res.json();
      if (data.success) {
        setStaffOperators(data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchStaffOperators();
  }, [id]);

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

  const getEquipmentCategoryName = (id: string) => EQUIPMENT_CATEGORIES[id] || id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The booking details could not be loaded.'}</p>
        <Link href="/vendor/equipment/bookings" className="text-amber-600 font-medium hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/vendor/equipment/bookings" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.bookingNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">Created on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Wrench className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{booking.equipmentName}</h2>
                  <p className="text-gray-600">{getEquipmentCategoryName(booking.equipmentCategory)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Delivery Location</p>
                    <p className="font-medium">{booking.deliveryCity}</p>
                    {booking.deliveryAddress && <p className="text-sm text-gray-600">{booking.deliveryAddress}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Security Deposit</p>
                    <p className="font-medium text-amber-700">₹{booking.securityDeposit.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Refundable on return</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Rental Period</p>
                    <p className="font-medium">{new Date(booking.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(booking.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-sm text-gray-600">{booking.rentalDays} day{booking.rentalDays > 1 ? 's' : ''} @ ₹{booking.dailyRate.toLocaleString()}/day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Start Date</p>
                    <p className="font-medium">{new Date(booking.startDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Customer Info
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">{booking.customerName}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">{booking.customerPhone}</p>
                  </div>
                  <a href={`tel:${booking.customerPhone}`} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
                {booking.customerEmail && (
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{booking.customerEmail}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-600" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Security Deposit</span>
                  <span className="font-bold text-amber-600">₹{booking.securityDeposit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Advance (Paid)</span>
                  <span className="font-bold text-green-600">₹{(booking.advancePaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Remaining Balance</span>
                  <span className="font-bold text-amber-600 text-lg">₹{(booking.totalAmount - (booking.advancePaid || 0)).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operator Assignment Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Operator Assignment
              </h3>
              {!booking.operatorName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition"
                >
                  Assign Operator
                </button>
              )}
              {booking.operatorName && !showAssignForm && ['DELIVERED', 'ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="text-amber-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Change Operator
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="p-6 bg-amber-50/30 space-y-6">
                <div className="space-y-4">
                  {/* Operator Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select Operator from Staff *</label>
                    {staffOperators.length > 0 ? (
                      <select
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
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
                          <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name *</label>
                          <input
                            type="text"
                            value={assignForm.operatorName}
                            onChange={(e) => setAssignForm({ ...assignForm, operatorName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="Enter operator name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Operator Phone *</label>
                          <input
                            type="tel"
                            value={assignForm.operatorPhone}
                            onChange={(e) => setAssignForm({ ...assignForm, operatorPhone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                            placeholder="9876543210"
                          />
                        </div>
                      </div>
                    )}

                    {assignForm.operatorName && staffOperators.length > 0 && (
                      <div className="p-3 bg-white border rounded-lg space-y-1">
                        <p className="text-sm font-bold">{assignForm.operatorName}</p>
                        <p className="text-xs text-gray-500">{assignForm.operatorPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignSubmit}
                    disabled={actionLoading || !assignForm.operatorName || !assignForm.operatorPhone}
                    className="px-6 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            ) : booking.operatorName ? (
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Assigned Operator</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.operatorName}</p>
                    <p className="text-amber-600 font-medium">{booking.operatorPhone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No operator assigned yet.</p>
                {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="mt-4 px-6 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
                  >
                    Assign Operator Now
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes Section */}
          {booking.customerNotes && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Customer Notes
              </h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.customerNotes}</p>
            </div>
          )}
        </div>

        {/* Sidebar / Status Flow */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-900 mb-6 border-b pb-4">Rental Progress</h3>

            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />

              {/* Step 1: Payment Verified */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Payment Verified</p>
                  <p className="text-xs text-gray-500">Booking confirmed</p>
                </div>
              </div>

              {/* Step 2: Operator Assigned */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.operatorName ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.operatorName ? 'text-gray-900' : 'text-gray-400'}`}>Operator Assigned</p>
                  <p className="text-xs text-gray-500">Ready for delivery</p>
                </div>
              </div>

              {/* Step 3: Delivered */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</p>
                  <p className="text-xs text-gray-500">Equipment delivered</p>
                  {booking.deliveredAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.deliveredAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 4: In Use */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['IN_USE', 'PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>In Use</p>
                  <p className="text-xs text-gray-500">Equipment in operation</p>
                  {booking.useStartedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.useStartedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 5: Pickup Scheduled */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['PICKUP_SCHEDULED', 'RETURNED', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Pickup Scheduled</p>
                  <p className="text-xs text-gray-500">Ready for return</p>
                  {booking.pickupScheduledAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.pickupScheduledAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 6: Returned */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['RETURNED', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['RETURNED', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Returned</p>
                  <p className="text-xs text-gray-500">Equipment returned</p>
                  {booking.returnedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.returnedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 7: Completed */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>Completed</p>
                  <p className="text-xs text-gray-500">Rental completed</p>
                </div>
              </div>
            </div>

            {/* OTP Display */}
            {(booking.deliveryOtp || booking.returnOtp) && (
              <div className="mt-8 pt-6 border-t space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  OTP Codes
                </h4>
                {booking.deliveryOtp && ['CONFIRMED', 'DELIVERED'].includes(booking.status) && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">Delivery OTP</p>
                    <p className="text-2xl font-mono font-bold text-amber-800">{booking.deliveryOtp}</p>
                  </div>
                )}
                {booking.returnOtp && ['PICKUP_SCHEDULED', 'RETURNED'].includes(booking.status) && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium">Return OTP</p>
                    <p className="text-2xl font-mono font-bold text-green-800">{booking.returnOtp}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            <div className="mt-6 pt-6 border-t">
              {booking.status === 'CONFIRMED' && booking.operatorName && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-sm font-bold text-amber-800 mb-1">Awaiting Delivery</p>
                  <p className="text-xs text-amber-700">
                    Operator {booking.operatorName} will deliver with OTP verification.
                  </p>
                </div>
              )}
              {['DELIVERED', 'IN_USE', 'PICKUP_SCHEDULED'].includes(booking.status) && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <p className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Equipment On Rent
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-bounce p-3 bg-yellow-200 rounded-full text-yellow-700">
                      <Wrench className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}
              {booking.status === 'ADVANCE_PAID' && !booking.operatorName && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-sm font-bold text-amber-800 mb-1">Assignment Pending</p>
                  <p className="text-xs text-amber-700">Please assign an operator to proceed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Proof */}
          {booking.advancePaymentProof && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4">Payment Proof</h3>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                <img
                  src={booking.advancePaymentProof}
                  alt="Payment Proof"
                  className="w-full h-full object-cover"
                />
                <a
                  href={booking.advancePaymentProof}
                  target="_blank"
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                >
                  <Eye className="text-white w-8 h-8" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
