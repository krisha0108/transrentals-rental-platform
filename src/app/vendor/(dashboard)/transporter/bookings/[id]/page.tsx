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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  vehicleCategory: string;
  vehicleName: string;
  goodsType: string;
  goodsDescription?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress?: string;
  dropCity: string;
  dropAddress?: string;
  estimatedDistance?: number;
  pickupDate: string;
  pickupTime: string;
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
  assignedDriver?: { id: string; name: string; phone: string; licenseNumber?: string };
  assignedVehicle?: { id: string; registrationNumber?: string; vehicle_model?: { name: string } };
  quoteRequest?: any;
  acceptedQuote?: any;
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
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  PAYMENT_SUBMITTED: { label: 'Payment Submitted', color: 'bg-orange-100 text-orange-700', icon: Clock },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  VEHICLE_ASSIGNED: { label: 'Vehicle Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  LOADING: { label: 'Loading', color: 'bg-orange-100 text-orange-700', icon: Truck },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  UNLOADING: { label: 'Unloading', color: 'bg-teal-100 text-teal-700', icon: Truck },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700', icon: AlertCircle },
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
          // Still need vehicle number if not set in fleet
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error || 'Booking not found'}</p>
        <Link href="/vendor/transporter/bookings" className="text-indigo-600 hover:underline mt-4 inline-block">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
  const StatusIcon = statusConfig.icon;
  const canAssign = ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/transporter/bookings"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">#{booking.bookingNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${statusConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-gray-600">{booking.vehicleName} - {booking.serviceType}</p>
        </div>
      </div>

      {/* Dropped Banner */}
      {booking.status === 'DROPPED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">This booking has been dropped</p>
            {(booking as any).dropReason && (
              <p className="text-sm text-red-600 mt-1">Reason: {(booking as any).dropReason}</p>
            )}
            {(booking as any).droppedAt && (
              <p className="text-xs text-red-500 mt-1">
                Dropped on: {new Date((booking as any).droppedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Route Details
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-semibold text-gray-900">{booking.pickupCity}</p>
                {booking.pickupAddress && <p className="text-sm text-gray-600">{booking.pickupAddress}</p>}
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="flex-1 bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Drop</p>
                <p className="font-semibold text-gray-900">{booking.dropCity}</p>
                {booking.dropAddress && <p className="text-sm text-gray-600">{booking.dropAddress}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {booking.pickupTime && ` at ${booking.pickupTime}`}
              </div>
              {booking.estimatedDistance && (
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-500" />
                  ~{booking.estimatedDistance} km
                </div>
              )}
            </div>
          </div>

          {/* Goods Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Goods Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Goods Type</p>
                <p className="font-medium text-gray-900">{booking.goodsType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehicle Required</p>
                <p className="font-medium text-gray-900">{booking.vehicleName}</p>
              </div>
              {booking.goodsDescription && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{booking.goodsDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Customer Details
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <a href={`mailto:${booking.customerEmail}`} className="font-medium text-indigo-600 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {booking.customerEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Info */}
          {(booking.driverName || booking.assignedDriver) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Assigned Driver & Vehicle
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Driver Name</p>
                  <p className="font-medium text-gray-900">{booking.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Driver Phone</p>
                  <a href={`tel:${booking.driverPhone}`} className="font-medium text-indigo-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {booking.driverPhone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="font-medium text-gray-900">{booking.vehicleNumber}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
              Payment Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Advance Paid</span>
                <span className="font-medium text-green-600">₹{booking.advancePaid?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Balance Due</span>
                <span className="font-bold text-indigo-600">
                  ₹{(booking.totalAmount - (booking.advancePaid || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canAssign && !booking.driverName && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <Button
                onClick={handleOpenAssignModal}
                className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Assign Driver & Vehicle
              </Button>
            </div>
          )}

          {/* Booking Progress */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Booking Progress
            </h2>
            <div className="relative">
              {/* Progress Line */}
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
                  { label: 'Booking Created', desc: 'Quote accepted by customer', done: createdDone, icon: <CheckCircle className="w-4 h-4" /> },
                  { label: 'Advance Payment', desc: paymentDone ? `₹${booking.advancePaid?.toLocaleString()} received` : 'Awaiting payment', done: paymentDone, icon: paymentDone ? <CheckCircle className="w-4 h-4" /> : <IndianRupee className="w-4 h-4" /> },
                  { label: 'Driver & Vehicle Assigned', desc: booking.driverName ? `${booking.driverName} • ${booking.vehicleNumber || 'Vehicle assigned'}` : 'Pending assignment', done: driverDone, icon: driverDone ? <CheckCircle className="w-4 h-4" /> : <UserCheck className="w-4 h-4" /> },
                  { label: 'Loading', desc: loadingDone ? 'Loading completed' : 'Waiting for driver', done: loadingDone, icon: <Package className="w-4 h-4" /> },
                  { label: 'In Transit', desc: transitDone ? 'Transit completed' : 'Pending', done: transitDone, icon: transitDone ? <CheckCircle className="w-4 h-4" /> : <Navigation className="w-4 h-4" /> },
                  { label: 'Delivered', desc: deliveredDone ? 'Successfully delivered' : 'Pending delivery', done: deliveredDone, icon: <CheckCircle className="w-4 h-4" /> },
                ];

                const timelineItems: any[] = [];
                for (let i = 0; i < steps.length; i++) {
                  const step = steps[i];
                  const isAfterDrop = isDropped && i > droppedAfterStep;
                  timelineItems.push({
                    ...step,
                    bgClass: isAfterDrop ? 'bg-gray-200 text-gray-400' : (step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'),
                    textClass: isAfterDrop ? 'text-gray-400' : (step.done ? 'text-gray-900' : 'text-gray-400'),
                  });
                  if (isDropped && i === droppedAfterStep) {
                    timelineItems.push({
                      label: 'Booking Dropped', desc: (booking as any).dropReason ? `Reason: ${(booking as any).dropReason}` : 'Booking was dropped',
                      done: false, icon: <XCircle className="w-4 h-4" />,
                      isDroppedMarker: true, bgClass: 'bg-red-600 text-white', textClass: 'text-red-700',
                    });
                  }
                }

                return (
                  <div className="space-y-6">
                    {timelineItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${item.bgClass}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`font-medium ${item.textClass}`}>{item.label}</p>
                          <p className={`text-xs ${item.isDroppedMarker ? 'text-red-500' : 'text-gray-500'}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Cancelled Status */}
            {booking.status === 'CANCELLED' && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Booking Cancelled</span>
                </div>
              </div>
            )}

            {/* Dropped Status */}
            {booking.status === 'DROPPED' && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Booking Dropped</span>
                </div>
                {(booking as any).dropReason && (
                  <p className="text-sm text-red-600 mt-2">Reason: {(booking as any).dropReason}</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Assign Driver & Vehicle</h2>
              <p className="text-sm text-gray-600">Select from your staff/fleet or enter manually</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAssignMode('select')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    assignMode === 'select'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Select from List
                </button>
                <button
                  onClick={() => setAssignMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    assignMode === 'manual'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Enter Manually
                </button>
              </div>

              {assignMode === 'select' ? (
                <>
                  {/* Select Driver */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserCheck className="w-4 h-4 inline mr-1" />
                      Select Driver
                    </label>
                    {drivers.length > 0 ? (
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                        No drivers found. Add drivers in Staff Management or enter manually.
                      </div>
                    )}
                  </div>

                  {/* Select Vehicle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="w-4 h-4 inline mr-1" />
                      Select Vehicle
                    </label>
                    {vehicles.length > 0 ? (
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                      <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700">
                        No vehicles found. Add vehicles in Fleet Management or enter manually.
                      </div>
                    )}
                  </div>

                  {/* Manual vehicle number if selected vehicle doesn't have reg */}
                  {selectedVehicleId && !vehicles.find(v => v.id === selectedVehicleId)?.registrationNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
                      <input
                        type="text"
                        value={manualVehicleNumber}
                        onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="MH12AB1234"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Fallback manual entry if no selection */}
                  {(!drivers.length || !vehicles.length) && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-3">Or enter details manually:</p>
                      {!drivers.length && (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={manualDriverName}
                            onChange={(e) => setManualDriverName(e.target.value)}
                            placeholder="Driver Name"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="tel"
                            value={manualDriverPhone}
                            onChange={(e) => setManualDriverPhone(e.target.value)}
                            placeholder="Driver Phone"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                      {!vehicles.length && (
                        <input
                          type="text"
                          value={manualVehicleNumber}
                          onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                          placeholder="Vehicle Number (e.g., MH12AB1234)"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-3"
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Manual Entry Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name *</label>
                    <input
                      type="text"
                      value={manualDriverName}
                      onChange={(e) => setManualDriverName(e.target.value)}
                      placeholder="Enter driver name"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Driver Phone *</label>
                    <input
                      type="tel"
                      value={manualDriverPhone}
                      onChange={(e) => setManualDriverPhone(e.target.value)}
                      placeholder="Enter driver phone"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number *</label>
                    <input
                      type="text"
                      value={manualVehicleNumber}
                      onChange={(e) => setManualVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="MH12AB1234"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAssignModal(false)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={isAssigning}
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
