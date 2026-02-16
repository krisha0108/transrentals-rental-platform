'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
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
  Car,
  Gift,
  Key,
  Star,
} from 'lucide-react';

interface LuxuryBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  occasion?: string;
  carCategory: string;
  carCategoryName?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupCity: string;
  pickupAddress?: string;
  dropCity?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  returnTime?: string;
  totalHours?: number;
  totalDays?: number;
  needDecoration?: boolean;
  decorationType?: string;
  grandTotal: number;
  advanceAmount: number;
  advancePaid: number;
  paymentStatus: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  vehicleBrand?: string;
  vehicleColor?: string;
  tripStartOtp?: string;
  tripEndOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  customerNotes?: string;
  createdAt: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
    requirements?: string;
  };
  acceptedQuote?: {
    id: string;
    quoteNumber: string;
    vehicleName: string;
    vehicleNumber?: string;
  };
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  isAvailable: boolean;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  vehicle_models: {
    id: string;
    name: string;
    brand: { id: string; name: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string } | null;
  brand: { id: string; name: string } | null;
  service: { id: string; name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting Advance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ADVANCE_PAID: { label: 'Booking Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  IN_PROGRESS: { label: 'Trip In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const LUXURY_CATEGORIES: Record<string, string> = {
  'luxury-sedan': 'Luxury Sedan',
  'luxury-suv': 'Luxury SUV',
  'vintage': 'Vintage Car',
  'sports': 'Sports Car',
  'limousine': 'Limousine',
  'convertible': 'Convertible',
};

export default function VendorLuxuryBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<LuxuryBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
    vehicle_models: '',
    vehicleBrand: '',
    vehicleColor: '',
  });

  const [staffDrivers, setStaffDrivers] = useState<StaffDriver[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);

  // Driver actions
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [showStartTripForm, setShowStartTripForm] = useState(false);
  const [showCompleteTripForm, setShowCompleteTripForm] = useState(false);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setAssignForm({
          driverName: data.booking.driverName || '',
          driverPhone: data.booking.driverPhone || '',
          vehicleNumber: data.booking.vehicleNumber || data.booking.acceptedQuote?.vehicleNumber || '',
          vehicle_models: data.booking.vehicle_models || '',
          vehicleBrand: data.booking.vehicleBrand || '',
          vehicleColor: data.booking.vehicleColor || '',
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

  const fetchStaffDrivers = async () => {
    try {
      const res = await fetch('/api/vendor/staff/drivers');
      const data = await res.json();
      if (data.success) {
        setStaffDrivers(data.drivers || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchFleetVehicles = async () => {
    try {
      const res = await fetch('/api/vendor/fleet');
      const data = await res.json();
      if (data.success && data.fleet) {
        // Filter for luxury vehicles
        const luxuryFleet = data.fleet.filter((v: FleetVehicle) => {
          const svc = (v as any).services || v.service;
          const slug = svc?.slug?.toLowerCase() || '';
          const name = svc?.name?.toLowerCase() || '';
          return slug.includes('luxury') || name.includes('luxury');
        });
        setFleetVehicles(luxuryFleet.length > 0 ? luxuryFleet : data.fleet);
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    }
  };

  const handleFleetSelection = (fleetId: string) => {
    if (!fleetId) {
      setAssignForm({ ...assignForm, vehicleNumber: '', vehicle_models: '', vehicleBrand: '' });
      return;
    }

    const vehicle = fleetVehicles.find(v => v.id === fleetId);
    if (vehicle) {
      let vModel = '';
      let vBrand = '';
      if (vehicle.vehicle_models) {
        vBrand = vehicle.vehicle_models.brand?.name || '';
        vModel = vehicle.vehicle_models.name;
      } else if (vehicle.brand && vehicle.vehicle_category) {
        vBrand = vehicle.brand.name;
        vModel = vehicle.vehicle_category.name;
      }

      setAssignForm({
        ...assignForm,
        vehicleNumber: vehicle.registrationNumber || '',
        vehicle_models: vModel,
        vehicleBrand: vBrand,
      });
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchStaffDrivers();
    fetchFleetVehicles();
  }, [id]);

  const handleAssignSubmit = async () => {
    if (!assignForm.driverName || !assignForm.driverPhone) {
      alert('Please fill driver details');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_driver', ...assignForm }),
      });

      const data = await response.json();
      if (data.success) {
        fetchBooking();
        setShowAssignForm(false);
        alert('Driver assigned successfully! Driver can now generate OTP when ready.');
      } else {
        alert(data.error || 'Failed to assign');
      }
    } catch (err) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate OTP for trip start
  const handleGenerateOtp = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_start_otp' }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedOtp(data.otp);
        fetchBooking();
        alert('OTP Generated! Customer can now see this OTP. Ask them for it to start the trip.');
      } else {
        alert(data.error || 'Failed to generate OTP');
      }
    } catch (err) {
      alert('Failed to generate OTP');
    } finally {
      setActionLoading(false);
    }
  };

  // Start trip with OTP verification
  const handleStartTrip = async () => {
    if (!otpInput || otpInput.length !== 4) {
      alert('Please enter 4-digit OTP from customer');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_trip', otp: otpInput }),
      });

      const data = await response.json();
      if (data.success) {
        setOtpInput('');
        setShowStartTripForm(false);
        setGeneratedOtp(null);
        fetchBooking();
        alert('Trip started successfully!');
      } else {
        alert(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      alert('Failed to start trip');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete trip
  const handleCompleteTrip = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_trip' }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCompleteTripForm(false);
        fetchBooking();
        alert('Trip completed successfully!');
      } else {
        alert(data.error || 'Failed to complete trip');
      }
    } catch (err) {
      alert('Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryName = (id: string) => LUXURY_CATEGORIES[id] || id;

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
        <Link href="/vendor/luxury/bookings" className="text-amber-600 font-medium hover:underline inline-flex items-center gap-2">
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
          <Link href="/vendor/luxury/bookings" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
          {/* Trip Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {booking.acceptedQuote?.vehicleName || booking.carCategoryName || getCategoryName(booking.carCategory)}
                  </h2>
                  <p className="text-gray-600 capitalize">{booking.tripType?.replace('-', ' ')} • {booking.occasion || 'Premium Rental'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup</p>
                    <p className="font-medium">{booking.pickupCity}</p>
                    {booking.pickupAddress && <p className="text-sm text-gray-600">{booking.pickupAddress}</p>}
                  </div>
                </div>
                {booking.dropCity && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Drop</p>
                      <p className="font-medium">{booking.dropCity}</p>
                      {booking.dropAddress && <p className="text-sm text-gray-600">{booking.dropAddress}</p>}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Schedule</p>
                    <p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p className="text-sm text-gray-600">at {booking.pickupTime}</p>
                    {booking.totalDays && booking.totalDays > 1 && (
                      <p className="text-sm text-amber-600 font-medium">{booking.totalDays} Days</p>
                    )}
                    {booking.totalHours && (
                      <p className="text-sm text-amber-600 font-medium">{booking.totalHours} Hours Package</p>
                    )}
                  </div>
                </div>
                {booking.needDecoration && (
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-pink-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Decoration</p>
                      <p className="font-medium capitalize">{booking.decorationType || 'Requested'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(booking.customerNotes || booking.quoteRequest?.requirements) && (
              <div className="px-6 pb-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700 font-bold uppercase mb-1">Special Requirements</p>
                  <p className="text-sm text-amber-800">{booking.customerNotes || booking.quoteRequest?.requirements}</p>
                </div>
              </div>
            )}
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
                  <span className="font-bold text-gray-900">₹{booking.grandTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Advance (Paid)</span>
                  <span className="font-bold text-green-600">₹{(booking.advancePaid || booking.advanceAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Balance Due</span>
                  <span className="font-bold text-amber-600 text-lg">₹{(booking.grandTotal - (booking.advancePaid || booking.advanceAmount || 0)).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Assignment Section */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Driver & Vehicle Assignment
              </h3>
              {!booking.driverName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                >
                  Assign Driver
                </button>
              )}
              {booking.driverName && !showAssignForm && ['DRIVER_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) && (
                <button
                  onClick={() => setShowAssignForm(true)}
                  className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Update Details
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="p-6 bg-indigo-50/30 space-y-6">
                <div className="space-y-4">
                  {/* Vehicle Selection */}
                  {fleetVehicles.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-indigo-200">
                      <label className="block text-sm font-medium text-gray-700">
                        <Car className="w-4 h-4 inline mr-1 text-amber-500" />
                        Select Vehicle from Fleet
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                        onChange={(e) => handleFleetSelection(e.target.value)}
                      >
                        <option value="">-- Select a vehicle from your fleet --</option>
                        {fleetVehicles.map((vehicle) => {
                          let displayName = '';
                          if (vehicle.vehicle_models) {
                            displayName = vehicle.vehicle_models.brand?.name
                              ? `${vehicle.vehicle_models.brand.name} ${vehicle.vehicle_models.name}`
                              : vehicle.vehicle_models.name;
                          } else if (vehicle.brand && vehicle.vehicle_category) {
                            displayName = `${vehicle.brand.name} ${vehicle.vehicle_category.name}`;
                          } else if (vehicle.vehicle_category) {
                            displayName = vehicle.vehicle_category.name;
                          }
                          const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                          return (
                            <option key={vehicle.id} value={vehicle.id}>
                              {displayName}{regNum}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Manual Vehicle Entry */}
                  <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-indigo-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        value={assignForm.vehicleNumber}
                        onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="MH 12 AB 1234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                      <input
                        type="text"
                        value={assignForm.vehicle_models}
                        onChange={(e) => setAssignForm({ ...assignForm, vehicle_models: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Mercedes S-Class"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={assignForm.vehicleBrand}
                        onChange={(e) => setAssignForm({ ...assignForm, vehicleBrand: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Mercedes-Benz"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={assignForm.vehicleColor}
                        onChange={(e) => setAssignForm({ ...assignForm, vehicleColor: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Black"
                      />
                    </div>
                  </div>

                  {/* Driver Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Chauffeur / Driver Details *</label>
                    {staffDrivers.length > 0 ? (
                      <>
                        <select
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          value={staffDrivers.find(d => d.name === assignForm.driverName)?.id || ''}
                          onChange={(e) => {
                            const driver = staffDrivers.find(d => d.id === e.target.value);
                            if (driver) {
                              setAssignForm({ ...assignForm, driverName: driver.name, driverPhone: driver.phone });
                            }
                          }}
                        >
                          <option value="">-- Select from your staff --</option>
                          {staffDrivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                          ))}
                        </select>
                      </>
                    ) : null}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur Name *</label>
                        <input
                          type="text"
                          value={assignForm.driverName}
                          onChange={(e) => setAssignForm({ ...assignForm, driverName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter chauffeur name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chauffeur Phone *</label>
                        <input
                          type="tel"
                          value={assignForm.driverPhone}
                          onChange={(e) => setAssignForm({ ...assignForm, driverPhone: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., 9737965551"
                        />
                      </div>
                    </div>
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
                    disabled={actionLoading || !assignForm.driverName || !assignForm.driverPhone}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            ) : booking.driverName ? (
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Assigned Chauffeur</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.driverName}</p>
                    <p className="text-indigo-600 font-medium">{booking.driverPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 md:border-l md:pl-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <Crown className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Vehicle Details</p>
                    <p className="font-bold text-gray-900 text-lg">{booking.vehicleNumber || 'N/A'}</p>
                    <p className="text-gray-600">{booking.vehicleBrand} {booking.vehicle_models}</p>
                    {booking.vehicleColor && <p className="text-sm text-gray-500">{booking.vehicleColor}</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No chauffeur assigned yet.</p>
                {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Assign Chauffeur Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Status Flow */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-gray-900 mb-6 border-b pb-4">Trip Progress</h3>

            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />

              {/* Step 1: Payment Verified */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Payment Verified</p>
                  <p className="text-xs text-gray-500">Booking confirmed</p>
                </div>
              </div>

              {/* Step 2: Driver Assigned */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.driverName ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.driverName ? 'text-gray-900' : 'text-gray-400'}`}>Chauffeur Assigned</p>
                  <p className="text-xs text-gray-500">Vehicle & driver ready</p>
                </div>
              </div>

              {/* Step 3: Trip Started */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Trip Started</p>
                  <p className="text-xs text-gray-500">Customer picked up</p>
                  {booking.tripStartedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.tripStartedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 4: Completed */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>Trip Completed</p>
                  <p className="text-xs text-gray-500">Service delivered</p>
                  {booking.tripEndedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.tripEndedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Driver Actions */}
            {booking.status === 'DRIVER_ASSIGNED' && (
              <div className="mt-8 pt-6 border-t space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  Start Trip
                </h4>

                {/* Step 1: Generate OTP */}
                {!booking.tripStartOtp && !generatedOtp && (
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-800 mb-3">
                      When you're ready to start the trip, generate an OTP. The customer will see this OTP on their app.
                    </p>
                    <button
                      onClick={handleGenerateOtp}
                      disabled={actionLoading}
                      className="w-full px-4 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:opacity-50"
                    >
                      {actionLoading ? 'Generating...' : 'Generate OTP'}
                    </button>
                  </div>
                )}

                {/* Step 2: OTP Generated - Ask customer */}
                {(booking.tripStartOtp || generatedOtp) && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-1">OTP Generated!</p>
                      <p className="text-sm text-green-800">Customer can see this OTP on their booking page. Ask them for the OTP verbally.</p>
                    </div>

                    {/* Regenerate OTP option */}
                    <button
                      onClick={handleGenerateOtp}
                      disabled={actionLoading}
                      className="w-full px-3 py-2 text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? 'Regenerating...' : 'Regenerate OTP'}
                    </button>

                    {/* Step 3: Enter OTP from customer */}
                    <div className="bg-white p-4 rounded-xl border-2 border-indigo-200">
                      <p className="text-sm font-bold text-gray-900 mb-3">Enter OTP from Customer</p>
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Enter 4-digit OTP"
                        maxLength={4}
                        className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={handleStartTrip}
                        disabled={actionLoading || otpInput.length !== 4}
                        className="w-full mt-3 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {actionLoading ? 'Verifying...' : 'Start Trip'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Trip Button */}
            {booking.status === 'IN_PROGRESS' && (
              <div className="mt-8 pt-6 border-t space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Complete Trip
                </h4>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Trip in Progress
                  </p>
                  <div className="flex justify-center mb-4">
                    <div className="animate-bounce p-3 bg-purple-200 rounded-full text-purple-700">
                      <Crown className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-700 mb-3 text-center">
                    When the trip is finished, click below to complete.
                  </p>
                  <button
                    onClick={handleCompleteTrip}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Completing...' : 'Complete Trip'}
                  </button>
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className="mt-6 pt-6 border-t">
              {booking.status === 'ADVANCE_PAID' && !booking.driverName && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <p className="text-sm font-bold text-amber-800 mb-1">Assignment Pending</p>
                  <p className="text-xs text-amber-700">Please assign a chauffeur and vehicle to proceed.</p>
                </div>
              )}
              {booking.status === 'COMPLETED' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm font-bold text-green-800 mb-1">Trip Completed</p>
                  <p className="text-xs text-green-700">Thank you for providing premium service!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
