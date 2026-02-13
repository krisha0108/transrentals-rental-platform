'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
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
  Home,
  Building,
  Key,
  Boxes,
  ArrowRight,
  TruckIcon,
  Loader2,
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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting Advance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ADVANCE_PAID: { label: 'Booking Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  PACKING: { label: 'Packing', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  LOADING: { label: 'Loading', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  UNLOADING: { label: 'Unloading', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  UNPACKING: { label: 'Unpacking', color: 'text-pink-700', bgColor: 'bg-pink-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
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

  const fetchStaffMembers = async () => {
    try {
      const res = await fetch('/api/vendor/staff');
      const data = await res.json();
      if (data.success) {
        // Filter for active staff members who could be team leaders or helpers
        const activeStaff = data.staff?.filter((s: StaffMember) =>
          s.status === 'ACTIVE' && (s.role === 'DRIVER' || s.role === 'HELPER')
        ) || [];
        setStaffMembers(activeStaff);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchStaffMembers();
  }, [id]);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The booking details could not be loaded.'}</p>
        <Link href="/vendor/packers/bookings" className="text-cyan-600 font-medium hover:underline inline-flex items-center gap-2">
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
          <Link href="/vendor/packers/bookings" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
          {/* Moving Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-cyan-50 to-teal-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Package className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getPropertySizeName(booking.propertySize || '')}</h2>
                  <p className="text-gray-600">{booking.serviceType?.replace('-', ' ').toUpperCase() || 'Packers & Movers'}</p>
                  <p className="text-sm text-gray-500 capitalize">{booking.movingService || 'Full Service'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Route */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">From</p>
                      <p className="font-medium">{booking.pickupCity}</p>
                      {booking.pickupAddress && <p className="text-sm text-gray-600">{booking.pickupAddress}</p>}
                      {booking.pickupFloor !== undefined && (
                        <p className="text-xs text-gray-500">Floor: {booking.pickupFloor} {booking.hasPickupLift ? '(Lift)' : '(No Lift)'}</p>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">To</p>
                      <p className="font-medium">{booking.dropCity}</p>
                      {booking.dropAddress && <p className="text-sm text-gray-600">{booking.dropAddress}</p>}
                      {booking.dropFloor !== undefined && (
                        <p className="text-xs text-gray-500">Floor: {booking.dropFloor} {booking.hasDropLift ? '(Lift)' : '(No Lift)'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Property Details */}
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Scheduled Date</p>
                      <p className="font-medium">{new Date(booking.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Team Size</p>
                      <p className="font-medium">{booking.teamSize || 'Not specified'} members</p>
                      {booking.quoteRequest?.propertySize && (
                        <p className="text-sm text-gray-600">{getPropertySizeName(booking.quoteRequest.propertySize)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600" />
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
                <CreditCard className="w-5 h-5 text-cyan-600" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Advance {booking.advancePaid ? '(Paid)' : '(Pending)'}</span>
                  <span className={`font-bold ${booking.advancePaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    ₹{booking.advanceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Remaining Balance</span>
                  <span className="font-bold text-cyan-600 text-lg">₹{getBalanceAmount().toLocaleString()}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' || booking.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Assignment Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-600" />
                Team Assignment
              </h3>
              {!booking.teamLeaderName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition"
                >
                  Assign Team
                </button>
              )}
              {booking.teamLeaderName && !showAssignForm && ['TEAM_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="text-cyan-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Change Team
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="p-6 bg-cyan-50/30 space-y-6">
                <div className="space-y-4">
                  {/* Team Leader Selection */}
                  <div className="space-y-3 pb-4 border-b border-cyan-200">
                    <label className="block text-sm font-medium text-gray-700">
                      <Users className="w-4 h-4 inline mr-1 text-cyan-500" />
                      Select Team Leader from Staff *
                    </label>
                    {staffMembers.length > 0 ? (
                      <select
                        className="w-full px-4 py-2.5 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-white"
                        value={staffMembers.find(s => s.name === assignForm.teamLeaderName)?.id || ''}
                        onChange={(e) => {
                          const member = staffMembers.find(s => s.id === e.target.value);
                          if (member) {
                            setAssignForm({ ...assignForm, teamLeaderName: member.name, teamLeaderPhone: member.phone });
                          } else {
                            setAssignForm({ ...assignForm, teamLeaderName: '', teamLeaderPhone: '' });
                          }
                        }}
                      >
                        <option value="">-- Select team leader --</option>
                        {staffMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.phone}) - {member.role}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader Name *</label>
                          <input
                            type="text"
                            value={assignForm.teamLeaderName}
                            onChange={(e) => setAssignForm({ ...assignForm, teamLeaderName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                            placeholder="Enter team leader name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Team Leader Phone *</label>
                          <input
                            type="tel"
                            value={assignForm.teamLeaderPhone}
                            onChange={(e) => setAssignForm({ ...assignForm, teamLeaderPhone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500"
                            placeholder="9737965551"
                          />
                        </div>
                      </div>
                    )}

                    {assignForm.teamLeaderName && (
                      <div className="p-3 bg-white border border-cyan-200 rounded-lg space-y-1">
                        <p className="text-sm font-bold text-cyan-800">{assignForm.teamLeaderName}</p>
                        <p className="text-xs text-cyan-600">{assignForm.teamLeaderPhone}</p>
                      </div>
                    )}
                  </div>

                  {/* Team Members */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <Boxes className="w-4 h-4 inline mr-1 text-cyan-500" />
                      Team Members (Optional)
                    </label>
                    <textarea
                      value={assignForm.teamMembers}
                      onChange={(e) => setAssignForm({ ...assignForm, teamMembers: e.target.value })}
                      className="w-full px-4 py-2 border border-cyan-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
                      placeholder="Enter team member names (comma separated)&#10;Example: Rajesh Kumar, Amit Singh, Suresh Verma"
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">You can add additional team members who will assist in packing and moving</p>
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
                    disabled={actionLoading || !assignForm.teamLeaderName || !assignForm.teamLeaderPhone}
                    className="px-6 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            ) : booking.teamLeaderName ? (
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Team Leader</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.teamLeaderName}</p>
                    <p className="text-cyan-600 font-medium">{booking.teamLeaderPhone}</p>
                  </div>
                </div>

                {booking.teamMembers && (
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Team Members</p>
                    <div className="bg-cyan-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{booking.teamMembers}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No team assigned yet.</p>
                {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="mt-4 px-6 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700"
                  >
                    Assign Team Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Status Flow */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-900 mb-6 border-b pb-4">Moving Progress</h3>

            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />

              {/* Step 1: Payment Verified */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED', 'PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Payment Verified</p>
                  <p className="text-xs text-gray-500">Booking confirmed</p>
                </div>
              </div>

              {/* Step 2: Team Assigned */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.teamLeaderName ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.teamLeaderName ? 'text-gray-900' : 'text-gray-400'}`}>Team Assigned</p>
                  <p className="text-xs text-gray-500">Moving team ready</p>
                </div>
              </div>

              {/* Step 3: Packing */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Packing</p>
                  <p className="text-xs text-gray-500">Items being packed</p>
                  {booking.packingStartedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.packingStartedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 4: Loading */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Loading</p>
                  <p className="text-xs text-gray-500">Loading into vehicle</p>
                  {booking.packingCompletedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.packingCompletedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 5: In Transit */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['IN_TRANSIT', 'UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>In Transit</p>
                  <p className="text-xs text-gray-500">Moving to destination</p>
                  {booking.loadingCompletedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.loadingCompletedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 6: Unloading */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <TruckIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['UNLOADING', 'UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Unloading</p>
                  <p className="text-xs text-gray-500">Unloading at destination</p>
                  {booking.unloadingStartedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.unloadingStartedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 7: Unpacking */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['UNPACKING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['UNPACKING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Unpacking</p>
                  <p className="text-xs text-gray-500">Setting up at new place</p>
                  {booking.unloadingCompletedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.unloadingCompletedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 8: Completed */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>Completed</p>
                  <p className="text-xs text-gray-500">Moving completed</p>
                  {booking.completedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.completedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>


            {/* Status Display - Vendor can only view, driver manages actions via driver app */}
            {booking.status === 'COMPLETED' && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-medium">Booking Completed</p>
                  {booking.completedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(booking.completedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className="mt-6 pt-6 border-t">
              {booking.status === 'TEAM_ASSIGNED' && (
                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                  <p className="text-sm font-bold text-cyan-800 mb-1">Ready to Start</p>
                  <p className="text-xs text-cyan-700">
                    Team leader {booking.teamLeaderName} will start packing with OTP verification.
                  </p>
                </div>
              )}
              {['PACKING', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'UNPACKING'].includes(booking.status) && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Moving in Progress
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-bounce p-3 bg-purple-200 rounded-full text-purple-700">
                      <Package className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}
              {booking.status === 'ADVANCE_PAID' && !booking.teamLeaderName && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm font-bold text-blue-800 mb-1">Assignment Pending</p>
                  <p className="text-xs text-blue-700">Please assign a team to proceed with the moving.</p>
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
