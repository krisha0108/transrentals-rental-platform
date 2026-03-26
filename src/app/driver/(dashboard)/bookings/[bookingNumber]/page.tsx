'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Car,
  Calendar,
  MapPin,
  Clock,
  Phone,
  User,
  Mail,
  Navigation,
  CheckCircle,
  AlertCircle,
  Play,
  Square,
  Loader2,
  KeyRound,
  Send,
  Bus,
  Truck,
  Package,
  PackageCheck,
  Wrench,
  Home,
  Boxes,
  PackageOpen,
  RotateCcw,
  Crown,
  RefreshCw,
} from 'lucide-react';

interface Booking {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategory: string;
  carCategoryName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupCity: string;
  dropCity?: string;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  tripDays?: number;
  baseFare: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  otpSent?: boolean;
  tripStartedAt?: string;
  tripEndedAt?: string;
  actualKmTravelled?: number;
  actualHours?: number;
  vehicleNumber?: string;
  vehicle_model?: string;
  driverBatta?: number;
  nightCharges?: number;
  tollCharges?: number;
  serviceType?: 'car' | 'bus' | 'truck' | 'packers' | 'equipment' | 'luxury' | 'b2b';
  location?: {
    id: string;
    name: string;
  };
  createdAt: string;
  // B2B-specific fields
  b2bBookingNumber?: string;
  b2bStatus?: string;
  vehicleImage?: string;
  vehicleBrand?: string;
  vehicleColor?: string;
  vehicleSeats?: number;
  vehicleFuel?: string;
  // Truck-specific fields
  goodsType?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  loadingStartedAt?: string;
  loadingCompletedAt?: string;
  deliveredAt?: string;
  // Packers-specific fields
  movingService?: string;
  fromAddress?: string;
  toAddress?: string;
  packingOtp?: string;
  packingOtpSent?: boolean;
  loadingOtpSent?: boolean;
  deliveryOtpSent?: boolean;
  packingStartedAt?: string;
  packingCompletedAt?: string;
  unpackingStartedAt?: string;
  unpackingCompletedAt?: string;
  jobCompletedAt?: string;
  // Equipment-specific fields
  equipmentCategory?: string;
  deliveryAddress?: string;
  returnOtp?: string;
  startDate?: string;
  endDate?: string;
  rentalDays?: number;
  equipmentDeliveredAt?: string;
  useStartedAt?: string;
  pickupScheduledAt?: string;
  returnedAt?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  // Car/Bus/Truck statuses
  DRIVER_ASSIGNED: { label: 'Ready to Start', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  VEHICLE_ASSIGNED: { label: 'Ready to Start', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  IN_PROGRESS: { label: 'Trip in Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  LOADING: { label: 'Loading in Progress', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  UNLOADING: { label: 'Unloading in Progress', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  COMPLETED: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
  // Packers & Movers statuses
  TEAM_ASSIGNED: { label: 'Team Assigned', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PACKING: { label: 'Packing in Progress', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  UNPACKING: { label: 'Unpacking in Progress', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  // Equipment Rental statuses
  CONFIRMED: { label: 'Ready for Delivery', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  DELIVERED: { label: 'Equipment Delivered', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  IN_USE: { label: 'Equipment in Use', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  PICKUP_SCHEDULED: { label: 'Pickup Scheduled', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  RETURNED: { label: 'Equipment Returned', color: 'text-green-700', bgColor: 'bg-green-100' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local Trip',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
  FULL_LOAD: 'Full Load',
  PART_LOAD: 'Part Load',
  CONTAINER: 'Container',
  ODC: 'ODC (Over Dimensional Cargo)',
};

const SERVICE_ICONS: Record<string, any> = {
  car: Car,
  bus: Bus,
  truck: Truck,
  packers: Package,
  equipment: Wrench,
  luxury: Crown,
  b2b: Car,
};

export default function DriverBookingDetailPage() {
  const params = useParams()!;
  const bookingNumber = params.bookingNumber as string;
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP flow
  const [otpSending, setOtpSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Complete trip form
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    actualKm: '',
    actualHours: '',
    tollCharges: '',
    parkingCharges: '',
  });

  // Assign vehicle (independent driver)
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [useManualVehicle, setUseManualVehicle] = useState(false);
  const [manualVehicleNo, setManualVehicleNo] = useState('');
  const [manualVehicleModel, setManualVehicleModel] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchBooking();
    // Load fleet for assign vehicle step
    fetch('/api/driver/fleet')
      .then(r => r.json())
      .then(d => { if (d.success) setFleet((d.vehicles || []).filter((v: any) => !v.isVendorVehicle && v.isActive !== false)); })
      .catch(() => {});
  }, [bookingNumber]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/driver/bookings/${bookingNumber}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        // Check if OTP was already sent based on service type and status
        const b = data.booking;
        if (b.serviceType === 'packers') {
          // For packers, check specific OTP sent flags based on status
          if (b.status === 'TEAM_ASSIGNED' && b.packingOtpSent) {
            setOtpSent(true);
          } else if (b.status === 'PACKING' && b.loadingOtpSent) {
            setOtpSent(true);
          } else if (b.status === 'IN_TRANSIT' && b.deliveryOtpSent) {
            setOtpSent(true);
          } else {
            setOtpSent(false);
          }
        } else if (b.serviceType === 'luxury') {
          // For luxury, if OTP was generated, show the input form
          if (b.otpSent) {
            setOtpSent(true);
            setShowOtpForm(true);
          } else {
            setOtpSent(false);
            setShowOtpForm(false);
          }
        } else if (b.otpSent) {
          // For other service types, use generic otpSent flag
          setOtpSent(true);
        }
      } else {
        setError(data.error || 'Failed to fetch booking');
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
      setError('Failed to fetch booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setOtpSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_otp' }),
      });

      const data = await response.json();

      if (data.success) {
        // For B2B, refresh to show OTP card instead of entry form
        if (booking?.serviceType === 'b2b') {
          setSuccessMessage(data.message);
          fetchBooking();
        } else {
          setOtpSent(true);
          setShowOtpForm(true);
          setSuccessMessage(data.message);
        }
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleStartTrip = async () => {
    if (!otp) {
      setError('Please enter the OTP from customer');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_trip', otp }),
      });

      const data = await response.json();

      if (data.success) {
        setShowOtpForm(false);
        setOtp('');
        fetchBooking(); // Refresh booking data
        alert('Trip started successfully!');
      } else {
        setError(data.error || 'Failed to start trip');
      }
    } catch (error) {
      setError('Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_trip',
          ...completeForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCompleteForm(false);
        fetchBooking(); // Refresh booking data
        alert('Trip completed successfully!');
      } else {
        setError(data.error || 'Failed to complete trip');
      }
    } catch (error) {
      setError('Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!useManualVehicle && !selectedVehicleId) {
      setError('Select a vehicle from your fleet or enter details manually');
      return;
    }
    if (useManualVehicle && !manualVehicleNo.trim()) {
      setError('Please enter vehicle registration number');
      return;
    }
    setAssignLoading(true);
    setError('');
    try {
      const body = useManualVehicle
        ? { action: 'assign_vehicle', vehicleNumber: manualVehicleNo.trim().toUpperCase(), vehicleModel: manualVehicleModel.trim() }
        : { action: 'assign_vehicle', vehicleId: selectedVehicleId };

      const res = await fetch(`/api/driver/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message);
        fetchBooking();
      } else {
        setError(data.error || 'Failed to assign vehicle');
      }
    } catch {
      setError('Failed to assign vehicle');
    } finally {
      setAssignLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Booking not found'}</p>
        <Link href="/driver/bookings" className="text-emerald-600 mt-4 inline-block">
          Go back to trips
        </Link>
      </div>
    );
  }

  const isBus = booking.serviceType === 'bus';
  const isTruck = booking.serviceType === 'truck';
  const isPackers = booking.serviceType === 'packers';
  const isEquipment = booking.serviceType === 'equipment';
  const isLuxury = booking.serviceType === 'luxury';
  const isB2B = booking.serviceType === 'b2b';
  const ServiceIcon = SERVICE_ICONS[booking.serviceType || 'car'] || Car;
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.DRIVER_ASSIGNED;

  // Get service-specific colors
  const getServiceColors = () => {
    if (isB2B) return { bg: 'bg-teal-200', text: 'text-teal-700' };
    if (isTruck) return { bg: 'bg-indigo-200', text: 'text-indigo-700' };
    if (isBus) return { bg: 'bg-orange-200', text: 'text-orange-700' };
    if (isPackers) return { bg: 'bg-cyan-200', text: 'text-cyan-700' };
    if (isEquipment) return { bg: 'bg-amber-200', text: 'text-amber-700' };
    if (isLuxury) return { bg: 'bg-purple-200', text: 'text-purple-700' };
    return { bg: 'bg-emerald-200', text: 'text-emerald-700' };
  };
  const serviceColors = getServiceColors();

  // Get page title based on service type
  const getPageTitle = () => {
    if (isPackers) return 'Job Details';
    if (isEquipment) return 'Rental Details';
    return 'Trip Details';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
          <p className="text-gray-500">#{booking.bookingNumber}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {successMessage}
        </div>
      )}

      {/* Status Card */}
      <div className={`${statusConfig.bgColor} rounded-xl p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${serviceColors.bg}`}>
              <ServiceIcon className={`w-7 h-7 ${serviceColors.text}`} />
            </div>
            <div>
              <p className={`text-sm ${statusConfig.color}`}>Status</p>
              <p className={`text-2xl font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </p>
              {isTruck && booking.goodsType && (
                <p className="text-sm text-gray-600 mt-1">Goods: {booking.goodsType}</p>
              )}
              {isPackers && booking.movingService && (
                <p className="text-sm text-gray-600 mt-1">Service: {booking.movingService}</p>
              )}
              {isEquipment && booking.equipmentCategory && (
                <p className="text-sm text-gray-600 mt-1">Category: {booking.equipmentCategory}</p>
              )}
              {isB2B && booking.b2bBookingNumber && (
                <p className="text-sm text-gray-600 mt-1">B2B Booking: {booking.b2bBookingNumber}</p>
              )}
            </div>
          </div>
          {['IN_PROGRESS', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'PACKING', 'UNPACKING', 'DELIVERED', 'IN_USE'].includes(booking.status) && (
            <Navigation className={`w-10 h-10 ${statusConfig.color} animate-pulse`} />
          )}
        </div>
      </div>

      {/* B2B Vehicle Image */}
      {isB2B && booking.vehicleImage && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 flex items-center justify-center">
            <img src={booking.vehicleImage} alt={booking.carCategoryName} className="max-h-[120px] object-contain" />
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{booking.carCategoryName}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  {booking.vehicleBrand && <span>{booking.vehicleBrand}</span>}
                  {booking.vehicleColor && <span>{booking.vehicleColor}</span>}
                  {booking.vehicleSeats && <span>{booking.vehicleSeats} seats</span>}
                  {booking.vehicleFuel && <span>{booking.vehicleFuel}</span>}
                </div>
              </div>
              {booking.vehicleNumber && (
                <span className="text-sm font-mono bg-gray-100 px-2.5 py-1 rounded-lg font-semibold">{booking.vehicleNumber}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* B2B - Driver Arrived, waiting for OTP from customer */}
      {isB2B && booking.b2bStatus === 'DRIVER_ARRIVED' && (
        <div className="bg-white rounded-xl border p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-700">
              You have arrived. The customer has received the OTP. Ask them to share it with you to start the trip.
            </p>
          </div>
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-emerald-600" />
            Enter OTP from Customer
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 4-digit OTP
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                placeholder="- - - -"
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          </div>
          <button
            onClick={handleStartTrip}
            disabled={actionLoading || otp.length !== 4}
            className="w-full mt-4 py-3 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-emerald-700 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5" />
                Verify OTP & Start Trip
              </>
            )}
          </button>
        </div>
      )}

      {/* Assign Vehicle — independent driver, status ACCEPTED */}
      {booking.status === 'ACCEPTED' && !isBus && !isTruck && !isPackers && !isEquipment && !isLuxury && !isB2B && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-600" /> Assign a Vehicle
          </h2>
          <p className="text-sm text-gray-500 mb-4">Select a vehicle from your fleet or enter details manually to assign to this trip.</p>

          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUseManualVehicle(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${!useManualVehicle ? 'bg-emerald-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              My Fleet
            </button>
            <button
              onClick={() => setUseManualVehicle(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${useManualVehicle ? 'bg-emerald-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Manual Entry
            </button>
          </div>

          {!useManualVehicle && (
            fleet.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Car className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No vehicles in fleet.</p>
                <button onClick={() => setUseManualVehicle(true)} className="text-emerald-600 text-sm font-medium mt-1 hover:underline">
                  Enter manually instead
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {fleet.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${selectedVehicleId === v.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{v.make} {v.model}</p>
                      <p className="text-xs text-emerald-700 font-medium">{v.registrationNo || 'No reg. no.'}</p>
                      {v.category && <p className="text-xs text-gray-500">{v.category}{v.fuelType ? ` · ${v.fuelType}` : ''}</p>}
                    </div>
                    {selectedVehicleId === v.id && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )
          )}

          {useManualVehicle && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm uppercase"
                  placeholder="MH12AB1234"
                  value={manualVehicleNo}
                  onChange={e => setManualVehicleNo(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="e.g. Maruti Swift Dzire"
                  value={manualVehicleModel}
                  onChange={e => setManualVehicleModel(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAssignVehicle}
            disabled={assignLoading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {assignLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Assigning...</> : <><CheckCircle className="w-4 h-4" /> Confirm Vehicle Assignment</>}
          </button>
        </div>
      )}

      {/* Action Buttons - Generic Car/Bus/Truck (NOT luxury or B2B arrived - they have own flows) */}
      {(booking.status === 'DRIVER_ASSIGNED' || booking.status === 'VEHICLE_ASSIGNED') && !isLuxury && !(isB2B && booking.b2bStatus === 'DRIVER_ARRIVED') && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            {isTruck ? <Package className="w-5 h-5 text-indigo-600" /> : <Play className="w-5 h-5 text-emerald-600" />}
            {isB2B ? 'Mark Arrival' : isTruck ? 'Start Loading' : 'Start Trip'}
          </h2>

          {/* Step 1: Send OTP to Customer */}
          {!otpSent && !showOtpForm && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {isB2B
                  ? 'When you arrive at the pickup location, tap below to mark your arrival. An OTP will be generated for the passenger to verify.'
                  : isTruck
                  ? 'When you arrive at the pickup location and are ready to start loading, send an OTP to the customer for verification.'
                  : 'When you\'re ready to start the trip, send an OTP to the customer. The customer will receive the OTP on their phone and will share it with you.'
                }
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className={`w-full py-3 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isTruck ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {isB2B ? "I've Arrived - Generate OTP" : isTruck ? 'Send Loading OTP' : 'Send OTP to Customer'}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Enter OTP received from customer */}
          {(otpSent || showOtpForm) && (
            <div className="space-y-4">
              <div className={`p-3 border rounded-lg ${isTruck ? 'bg-indigo-50 border-indigo-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className={isTruck ? 'text-sm text-indigo-700' : 'text-sm text-blue-700'}>
                  {isTruck
                    ? 'Loading OTP has been sent to customer. Ask them to share it to confirm loading can begin.'
                    : 'OTP has been sent to customer\'s phone. Ask the customer for the OTP to start the trip.'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit OTP from Customer
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className={`w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 ${
                      isTruck ? 'focus:ring-indigo-500' : 'focus:ring-emerald-500'
                    }`}
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Resend OTP
                    </>
                  )}
                </button>
                <button
                  onClick={handleStartTrip}
                  disabled={actionLoading || otp.length !== 4}
                  className={`flex-1 py-3 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isTruck ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isTruck ? <Package className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isTruck ? 'Start Loading' : 'Start Trip'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Truck Loading Status - Complete Loading and Start Transit */}
      {isTruck && booking.status === 'LOADING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            Loading Complete?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once all goods are loaded onto the truck, mark loading as complete to start the transit.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start_transit' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                } else {
                  setError(data.error || 'Failed to update status');
                }
              } catch (e) {
                setError('Failed to update status');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
            Loading Complete - Start Transit
          </button>
        </div>
      )}

      {/* Truck In Transit - Arrived at destination */}
      {isTruck && booking.status === 'IN_TRANSIT' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-orange-600" />
            Arrived at Destination?
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you arrive at the delivery location, send the delivery OTP to the customer to begin unloading.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Delivery OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  Delivery OTP sent. Ask customer to share the OTP to confirm goods delivery.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit Delivery OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_unloading', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to update status');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                  Start Unloading
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Truck Unloading - Complete Delivery */}
      {isTruck && booking.status === 'UNLOADING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Delivery
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once all goods are unloaded and delivered to the customer, mark the delivery as complete.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete_delivery' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                  alert('Delivery completed successfully!');
                } else {
                  setError(data.error || 'Failed to complete delivery');
                }
              } catch (e) {
                setError('Failed to complete delivery');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Mark Delivery Complete
          </button>
        </div>
      )}

      {/* ===== PACKERS & MOVERS FLOW ===== */}

      {/* Packers - Team Assigned - Start Packing */}
      {isPackers && booking.status === 'TEAM_ASSIGNED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-cyan-600" />
            Start Packing
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you arrive at the pickup location and are ready to start packing, send an OTP to the customer for verification.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Packing OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                <p className="text-sm text-cyan-700">
                  Packing OTP sent. Ask customer to share the OTP to confirm packing can begin.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit OTP from Customer
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_trip', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to start packing');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Boxes className="w-5 h-5" />}
                  Start Packing
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packers - Packing - Complete Packing & Start Loading (with OTP) */}
      {isPackers && booking.status === 'PACKING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Packing Complete?
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Once all items are packed, send loading OTP to customer for verification before starting loading.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Loading OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Loading OTP sent. Ask customer to share the OTP to confirm packing is complete and start loading.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit Loading OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_loading', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to start loading');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                  Start Loading
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packers - Loading - Complete Loading & Start Transit */}
      {isPackers && booking.status === 'LOADING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-purple-600" />
            Loading Complete?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once all packed items are loaded onto the vehicle, start transit to the destination.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start_transit' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                } else {
                  setError(data.error || 'Failed to update status');
                }
              } catch (e) {
                setError('Failed to update status');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
            Loading Complete - Start Transit
          </button>
        </div>
      )}

      {/* Packers - In Transit - Arrived at destination, Start Unloading */}
      {isPackers && booking.status === 'IN_TRANSIT' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-600" />
            Arrived at Destination?
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you arrive at the delivery location, send the delivery OTP to the customer to begin unloading.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Delivery OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  Delivery OTP sent. Ask customer to share the OTP to start unloading.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit Delivery OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_unloading', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to start unloading');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Home className="w-5 h-5" />}
                  Start Unloading
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Packers - Unloading - Complete Unloading & Start Unpacking */}
      {isPackers && booking.status === 'UNLOADING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-teal-600" />
            Unloading Complete?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once all items are unloaded at the destination, start unpacking and arrangement.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start_unpacking' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                } else {
                  setError(data.error || 'Failed to update status');
                }
              } catch (e) {
                setError('Failed to update status');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageOpen className="w-5 h-5" />}
            Unloading Complete - Start Unpacking
          </button>
        </div>
      )}

      {/* Packers - Unpacking - Complete Job */}
      {isPackers && booking.status === 'UNPACKING' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Unpacking & Arrangement Complete?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once all items are unpacked and arranged as per customer requirements, complete the job.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete_job' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                  alert('Job completed successfully!');
                } else {
                  setError(data.error || 'Failed to complete job');
                }
              } catch (e) {
                setError('Failed to complete job');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Complete Job
          </button>
        </div>
      )}

      {/* ===== EQUIPMENT RENTAL FLOW ===== */}

      {/* Equipment - Confirmed - Mark Delivered */}
      {isEquipment && booking.status === 'CONFIRMED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            Deliver Equipment
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you arrive at the delivery location with the equipment, send an OTP to the customer for verification.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Delivery OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  Delivery OTP sent. Ask customer to share the OTP to confirm equipment delivery.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit OTP from Customer
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_trip', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to mark delivered');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                  Mark Delivered
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipment - Delivered - Start Use */}
      {isEquipment && booking.status === 'DELIVERED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            Equipment Setup Complete?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once the equipment is set up and ready for use, mark it as in use.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'start_use' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                } else {
                  setError(data.error || 'Failed to update status');
                }
              } catch (e) {
                setError('Failed to update status');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
            Equipment Setup Complete - Start Use
          </button>
        </div>
      )}

      {/* Equipment - In Use - Schedule Pickup */}
      {isEquipment && booking.status === 'IN_USE' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-purple-600" />
            Ready for Pickup?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            When the rental period is ending and customer is ready to return the equipment, schedule pickup.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'schedule_pickup' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                } else {
                  setError(data.error || 'Failed to schedule pickup');
                }
              } catch (e) {
                setError('Failed to schedule pickup');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
            Schedule Equipment Pickup
          </button>
        </div>
      )}

      {/* Equipment - Pickup Scheduled - Confirm Return */}
      {isEquipment && booking.status === 'PICKUP_SCHEDULED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-orange-600" />
            Equipment Collected?
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you collect the equipment from customer, send a return OTP for verification.
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={otpSending}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Return OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  Return OTP sent. Ask customer to share the OTP to confirm equipment return.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit Return OTP
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestOtp}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Resend</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'confirm_return', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                      } else {
                        setError(data.error || 'Failed to verify OTP');
                      }
                    } catch (e) {
                      setError('Failed to confirm return');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                  Confirm Return
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Equipment - Returned - Complete Rental */}
      {isEquipment && booking.status === 'RETURNED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Equipment Checked?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once you've inspected the equipment and verified its condition, complete the rental.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete_rental' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                  alert('Rental completed successfully!');
                } else {
                  setError(data.error || 'Failed to complete rental');
                }
              } catch (e) {
                setError('Failed to complete rental');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Complete Rental
          </button>
        </div>
      )}

      {/* ===== LUXURY CAR FLOW ===== */}

      {/* Luxury - Driver Assigned - Generate OTP to start */}
      {isLuxury && booking.status === 'DRIVER_ASSIGNED' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Start Luxury Trip
          </h2>

          {!otpSent && !showOtpForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                When you're ready to start the trip, generate an OTP. The customer will see this OTP on their app. Ask them to share it with you verbally to verify and start the trip.
              </p>
              <button
                onClick={async () => {
                  setOtpSending(true);
                  setError('');
                  try {
                    const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'generate_start_otp' }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setOtpSent(true);
                      setShowOtpForm(true);
                      setSuccessMessage('OTP generated! Ask customer for this OTP to start the trip.');
                    } else {
                      setError(data.error || 'Failed to generate OTP');
                    }
                  } catch (e) {
                    setError('Failed to generate OTP');
                  } finally {
                    setOtpSending(false);
                  }
                }}
                disabled={otpSending}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {otpSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating OTP...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Generate Start OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">
                  OTP has been generated. Ask the customer to share the OTP from their app to start the trip.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 4-digit OTP from Customer
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full pl-12 pr-4 py-3 text-center text-2xl font-bold tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    placeholder="• • • •"
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setOtpSending(true);
                    setError('');
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'generate_start_otp' }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setSuccessMessage('New OTP generated!');
                      } else {
                        setError(data.error || 'Failed to regenerate OTP');
                      }
                    } catch (e) {
                      setError('Failed to regenerate OTP');
                    } finally {
                      setOtpSending(false);
                    }
                  }}
                  disabled={otpSending}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  {otpSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Regenerate</>}
                </button>
                <button
                  onClick={async () => {
                    if (!otp || otp.length !== 4) {
                      setError('Please enter valid OTP');
                      return;
                    }
                    setActionLoading(true);
                    try {
                      const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'start_trip', otp }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        setOtp('');
                        setOtpSent(false);
                        setShowOtpForm(false);
                        fetchBooking();
                        alert('Trip started successfully!');
                      } else {
                        setError(data.error || 'Invalid OTP. Please ask customer for correct OTP.');
                      }
                    } catch (e) {
                      setError('Failed to start trip');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading || otp.length !== 4}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  Start Trip
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Luxury - In Progress - Complete Trip */}
      {isLuxury && booking.status === 'IN_PROGRESS' && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Luxury Trip
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Once the trip is complete and the customer has been dropped off, mark the trip as completed.
          </p>
          <button
            onClick={async () => {
              setActionLoading(true);
              try {
                const response = await fetch(`/api/driver/bookings/${bookingNumber}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'complete_trip' }),
                });
                const data = await response.json();
                if (data.success) {
                  fetchBooking();
                  alert('Trip completed successfully!');
                } else {
                  setError(data.error || 'Failed to complete trip');
                }
              } catch (e) {
                setError('Failed to complete trip');
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Complete Trip
          </button>
        </div>
      )}

      {/* ===== CAR/BUS TRIP COMPLETE ===== */}

      {booking.status === 'IN_PROGRESS' && !isLuxury && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Square className="w-5 h-5 text-red-600" />
            Complete Trip
          </h2>

          {!showCompleteForm ? (
            <button
              onClick={() => setShowCompleteForm(true)}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700"
            >
              End Trip
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total KM Travelled
                  </label>
                  <input
                    type="number"
                    value={completeForm.actualKm}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualKm: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 150"
                  />
                </div>
                {!isBus && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={completeForm.actualHours}
                      onChange={(e) => setCompleteForm({ ...completeForm, actualHours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., 8"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Toll Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={completeForm.tollCharges}
                    onChange={(e) => setCompleteForm({ ...completeForm, tollCharges: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parking Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={completeForm.parkingCharges}
                    onChange={(e) => setCompleteForm({ ...completeForm, parkingCharges: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 100"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteTrip}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Trip
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trip/Job/Rental Details */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-900 mb-4">
          {isPackers ? 'Job Information' : isEquipment ? 'Rental Information' : 'Trip Information'}
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ServiceIcon className={`w-5 h-5 mt-0.5 ${serviceColors.text}`} />
            <div>
              <p className="text-sm text-gray-500">
                {isPackers ? 'Service' : isEquipment ? 'Equipment' : 'Vehicle'}
              </p>
              <p className="font-medium">{booking.carCategoryName}</p>
              <p className="text-sm text-gray-500">
                {isPackers ? (booking.movingService || 'Packers & Movers') :
                 isEquipment ? (booking.equipmentCategory || 'Equipment Rental') :
                 isBus ? booking.carCategory :
                 isTruck && booking.goodsType ? booking.goodsType :
                 (TRIP_TYPE_LABELS[booking.tripType] || booking.tripType)}
              </p>
            </div>
          </div>

          {/* Packers - From/To addresses */}
          {isPackers && booking.fromAddress && (
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">From Address</p>
                <p className="font-medium">{booking.fromAddress}</p>
              </div>
            </div>
          )}

          {isPackers && booking.toAddress && (
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">To Address</p>
                <p className="font-medium">{booking.toAddress}</p>
              </div>
            </div>
          )}

          {/* Equipment - Delivery address */}
          {isEquipment && booking.deliveryAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium">{booking.deliveryAddress}</p>
              </div>
            </div>
          )}

          {/* Standard Pickup/Drop for car/bus/truck */}
          {!isPackers && !isEquipment && (
            <>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Pickup</p>
                  <p className="font-medium">{booking.pickupCity}</p>
                  {booking.pickupAddress && (
                    <p className="text-sm text-gray-500">{booking.pickupAddress}</p>
                  )}
                </div>
              </div>

              {booking.dropCity && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Drop</p>
                    <p className="font-medium">{booking.dropCity}</p>
                    {booking.dropAddress && (
                      <p className="text-sm text-gray-500">{booking.dropAddress}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Date/Time based on service type */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">
                {isEquipment ? 'Rental Period' : isPackers ? 'Moving Date' : 'Pickup Date & Time'}
              </p>
              <p className="font-medium">
                {isEquipment && booking.startDate && booking.endDate ? (
                  <>
                    {new Date(booking.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })} - {new Date(booking.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {booking.rentalDays && <span className="text-gray-500 ml-2">({booking.rentalDays} days)</span>}
                  </>
                ) : (
                  <>
                    {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    {booking.pickupTime && `at ${booking.pickupTime}`}
                  </>
                )}
              </p>
            </div>
          </div>

          {booking.localPackageHours && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Package</p>
                <p className="font-medium">
                  {booking.localPackageHours} Hours / {booking.localPackageKm} KM
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-900 mb-4">Customer Details</h2>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{booking.customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <a
                href={`tel:${booking.customerPhone}`}
                className="font-medium text-emerald-600"
              >
                {booking.customerPhone}
              </a>
            </div>
          </div>

          {booking.customerEmail && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{booking.customerEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call Button */}
        <a
          href={`tel:${booking.customerPhone}`}
          className="mt-4 w-full py-3 bg-emerald-100 text-emerald-700 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Phone className="w-5 h-5" />
          Call Customer
        </a>
      </div>

      {/* Vehicle Details */}
      {booking.vehicleNumber && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4">Vehicle Details</h2>
          <div className="flex items-center gap-3">
            <Car className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium">{booking.vehicleNumber}</p>
              {booking.vehicle_models && (
                <p className="text-sm text-gray-500">{booking.vehicle_models}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trip Timestamps */}
      {(booking.tripStartedAt || booking.tripEndedAt) && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-bold text-gray-900 mb-4">Trip Timeline</h2>
          <div className="space-y-3">
            {booking.tripStartedAt && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">Trip Started</p>
                  <p className="font-medium">
                    {new Date(booking.tripStartedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
            {booking.tripEndedAt && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">Trip Ended</p>
                  <p className="font-medium">
                    {new Date(booking.tripEndedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
