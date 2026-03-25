'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Car,
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
  Plane,
  ArrowLeft,
  CreditCard,
  FileText,
  MessageSquare,
  Edit,
  MessageCircle,
} from 'lucide-react';
import VendorBookingChat from '@/components/vendor/VendorBookingChat';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  customerId: string | null;
  tripType: string;
  carCategory: string;
  carCategoryName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupCity: string;
  dropCity?: string;
  intermediateStops?: Array<{ id: string; locationId: string; cityText: string }>;
  pickupAddress?: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate?: string;
  totalDays?: number;
  localPackageId?: string;
  localPackageHours?: number;
  localPackageKm?: number;
  baseFare: number;
  chargeableKm?: number;
  perKmRate?: number;
  kmCharges?: number;
  driverBatta?: number;
  nightCharges?: number;
  tollCharges?: number;
  gstAmount: number;
  platformFee: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  paidAmount?: number;
  transactionId?: string;
  paymentMethod?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  tripStartOtp?: string;
  tripStartedAt?: string;
  tripEndedAt?: string;
  startKmReading?: number;
  endKmReading?: number;
  extraKm?: number;
  extraHours?: number;
  extraCharges?: number;
  tollCharges?: number;
  parkingCharges?: number;
  finalAmount?: number;
  customerNotes?: string;
  vendorNotes?: string;
  rating?: number;
  review?: string;
  location?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface StaffDriver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  status: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  isAvailable: boolean;
  licenseExpired: boolean;
  isAvailableForDates?: boolean;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  color: string | null;
  isAvailable: boolean;
  isActive: boolean;
  isAvailableForDates?: boolean;
  chauffeur_vehicle_categories?: {
    id: string;
    name: string;
    seatingCapacity?: number;
  } | null;
  brands?: {
    id: string;
    name: string;
  } | null;
  services?: {
    slug: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_VENDOR: { label: 'New Booking', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  BROADCASTED: { label: 'Open', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ACCEPTED: { label: 'Accepted', color: 'text-green-700', bgColor: 'bg-green-100' },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  DROPPED: { label: 'Dropped', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  LOCAL: 'Local Trip',
  OUTSTATION_ONEWAY: 'Outstation (One-way)',
  OUTSTATION_ROUNDTRIP: 'Outstation (Round Trip)',
  AIRPORT_PICKUP: 'Airport Pickup',
  AIRPORT_DROP: 'Airport Drop',
};

export default function VendorBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.bookingNumber as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Driver form
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverForm, setDriverForm] = useState({
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
    vehicle_models: '',
  });

  // Staff drivers
  const [staffDrivers, setStaffDrivers] = useState<StaffDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Fleet vehicles
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  // Complete trip form
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    endKmReading: '',
    extraHours: '',
    tollCharges: '',
    parkingCharges: '',
  });

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [vendorDbId, setVendorDbId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState<string>('');

  // Fetch vendor info from database
  useEffect(() => {
    async function fetchVendorInfo() {
      try {
        const res = await fetch('/api/vendor/profile');
        const data = await res.json();
        if (data.id) {
          setVendorDbId(data.id);
          setVendorName(data.businessName || data.ownerName || '');
        }
      } catch (error) {
        console.error('Failed to fetch vendor info:', error);
      }
    }
    fetchVendorInfo();
  }, []);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/vendor/car-rental/bookings/${bookingNumber}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        // Pre-fill driver form if driver exists
        if (data.booking.driverName) {
          setDriverForm({
            driverName: data.booking.driverName,
            driverPhone: data.booking.driverPhone || '',
            vehicleNumber: data.booking.vehicleNumber || '',
            vehicle_models: data.booking.vehicleModel || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDrivers = async (pickupDate?: string, returnDate?: string) => {
    try {
      let url = '/api/vendor/staff/drivers';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        const endDate = returnDate
          ? new Date(returnDate).toISOString()
          : startDate;
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const drivers: StaffDriver[] = data.drivers || [];
        // Sort: available drivers first, unavailable (assigned for dates) last
        drivers.sort((a, b) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setStaffDrivers(drivers);
        // If no drivers exist, default to manual entry
        if (drivers.length === 0) {
          setUseManualEntry(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      setUseManualEntry(true);
    }
  };

  const fetchFleetVehicles = async (pickupDate?: string, returnDate?: string) => {
    try {
      let fleetUrl = '/api/vendor/fleet';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        const endDate = returnDate
          ? new Date(returnDate).toISOString()
          : startDate;
        fleetUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const response = await fetch(fleetUrl);
      const data = await response.json();

      if (data.success) {
        // Filter only car-rental vehicles that are active
        const carRentalVehicles = (data.fleet || []).filter(
          (v: FleetVehicle) => {
            return v.services?.slug === 'car-rental' && v.isActive;
          }
        );
        // Sort: available vehicles first, unavailable (booked for dates) last
        carRentalVehicles.sort((a: FleetVehicle, b: FleetVehicle) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setFleetVehicles(carRentalVehicles);
      }
    } catch (error) {
      console.error('Failed to fetch fleet vehicles:', error);
    }
  };

  // Handle driver selection from dropdown
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    if (driverId === 'manual') {
      setUseManualEntry(true);
      setDriverForm({
        driverName: '',
        driverPhone: '',
        vehicleNumber: driverForm.vehicleNumber,
        vehicle_models: driverForm.vehicle_models,
      });
      return;
    }

    setUseManualEntry(false);
    const driver = staffDrivers.find(d => d.id === driverId);
    if (driver) {
      setDriverForm({
        driverName: driver.name,
        driverPhone: driver.phone,
        vehicleNumber: driverForm.vehicleNumber, // Keep vehicle info
        vehicle_models: driverForm.vehicle_models,
      });
    }
  };

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    if (vehicleId === 'manual') {
      setDriverForm({
        ...driverForm,
        vehicleNumber: '',
        vehicle_models: '',
      });
      return;
    }

    const vehicle = fleetVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const vehicle_model = vehicle.brands?.name
        ? `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories?.name || ''}`
        : vehicle.chauffeur_vehicle_categories?.name || '';
      setDriverForm({
        ...driverForm,
        vehicleNumber: vehicle.registrationNumber || '',
        vehicle_models: vehicle_model.trim(),
      });
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingNumber]);

  // Fetch drivers and fleet vehicles with booking dates when booking loads
  useEffect(() => {
    if (booking?.pickupDate) {
      fetchDrivers(booking.pickupDate, booking.returnDate);
      // Fetch fleet vehicles with booking dates for availability check
      fetchFleetVehicles(booking.pickupDate, booking.returnDate);
    } else if (booking) {
      // Booking loaded but no pickupDate - fetch fleet without dates
      fetchFleetVehicles();
    }
  }, [booking?.pickupDate, booking?.id]);

  const handleAction = async (action: string, extraData?: any) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/car-rental/bookings/${bookingNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await response.json();

      if (data.success) {
        fetchBooking();
        setShowDriverForm(false);
        setShowCompleteForm(false);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      alert('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = () => {
    if (!driverForm.driverName || !driverForm.driverPhone || !driverForm.vehicleNumber) {
      alert('Please fill all required fields');
      return;
    }
    handleAction('assign_driver', driverForm);
  };

  const handleUpdateDriver = () => {
    handleAction('update_driver', driverForm);
  };

  const handleCompleteTrip = () => {
    handleAction('complete_trip', {
      endKmReading: completeForm.endKmReading ? parseInt(completeForm.endKmReading) : null,
      extraHours: completeForm.extraHours ? parseInt(completeForm.extraHours) : 0,
      tollCharges: completeForm.tollCharges ? parseFloat(completeForm.tollCharges) : 0,
      parkingCharges: completeForm.parkingCharges ? parseFloat(completeForm.parkingCharges) : 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
        <Link href="/vendor/car-rental/bookings" className="text-emerald-600 hover:underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/vendor/car-rental/bookings"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">#{booking.bookingNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
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
          {/* Trip Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Trip Details
            </h2>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {booking.carCategoryName}
              </span>
              {booking.totalDays && booking.totalDays > 1 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {booking.totalDays} Days
                </span>
              )}
              {booking.localPackageHours && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {booking.localPackageHours}hrs / {booking.localPackageKm}km
                </span>
              )}
            </div>

            {/* Route */}
            {(() => {
              const stops = (booking.intermediateStops || []).filter((s) => s.cityText);
              const allPoints = [
                { city: booking.pickupCity, address: booking.pickupAddress, type: 'pickup' },
                ...stops.map((s) => ({ city: s.cityText, address: undefined, type: 'stop' })),
                { city: booking.dropCity || booking.pickupCity, address: booking.dropAddress, type: 'drop' },
              ];
              // Deduplicate if pickup===drop (local/round trip same city)
              const showDrop = booking.dropCity && booking.dropCity !== booking.pickupCity || stops.length > 0;
              const points = showDrop ? allPoints : [allPoints[0]];

              return (
                <div className="mb-5">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">Route</p>
                  <div className="relative">
                    {/* Vertical line */}
                    {points.length > 1 && (
                      <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-gray-200" />
                    )}
                    <div className="space-y-4">
                      {points.map((pt, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 border-white shadow-sm relative z-10 ${
                            i === 0 ? 'bg-emerald-500' :
                            i === points.length - 1 ? 'bg-red-500' :
                            'bg-orange-400'
                          }`} />
                          <div>
                            <p className="font-semibold text-gray-900">{pt.city}</p>
                            {pt.address && (
                              <p className="text-sm text-gray-500">{pt.address}</p>
                            )}
                            {i === 0 && (
                              <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                {new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {booking.pickupTime}
                              </p>
                            )}
                            {i === points.length - 1 && booking.returnDate && (
                              <p className="text-xs text-red-500 font-medium mt-0.5">
                                Return: {new Date(booking.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distance info */}
                  {booking.chargeableKm && booking.chargeableKm > 0 && (
                    <div className="mt-4 flex items-center gap-4 bg-blue-50 rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-blue-700 font-medium">{booking.chargeableKm} km</span>
                      {booking.perKmRate && (
                        <span className="text-blue-600">@ ₹{booking.perKmRate}/km</span>
                      )}
                      {stops.length > 0 && (
                        <span className="text-blue-500 text-xs">{stops.length + 1} legs · Multi-Stop</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Date info (if local/no drop city shown separately) */}
            {!booking.dropCity && !booking.intermediateStops?.length && (
              <div className="mb-5">
                <p className="text-xs text-gray-500 mb-1">Pickup Date & Time</p>
                <p className="font-medium">
                  {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-500">{booking.pickupTime}</p>
              </div>
            )}

            {booking.customerNotes && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500 mb-1">Customer Notes</p>
                <p className="text-sm text-gray-700">{booking.customerNotes}</p>
              </div>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Customer Details
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">{booking.customerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href={`tel:${booking.customerPhone}`} className="font-medium text-blue-600 hover:underline">
                    {booking.customerPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${booking.customerEmail}`} className="font-medium text-purple-600 hover:underline text-sm break-all">
                    {booking.customerEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t flex gap-3">
              {/* Accept / Reject Buttons — for PENDING_VENDOR / BROADCASTED */}
              {!booking.acceptedVendorId && ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) && (
                <>
                  <button
                    onClick={() => handleAction('accept')}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {actionLoading ? 'Processing...' : 'Accept'}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter reason for rejection:');
                      if (reason) handleAction('reject', { reason });
                    }}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-semibold disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                </>
              )}
              {vendorDbId && ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                >
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
              )}
            </div>
          </div>

          {/* Driver Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" />
                Driver & Vehicle
              </h2>
              {booking.driverName && ['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
                <button
                  onClick={() => setShowDriverForm(!showDriverForm)}
                  className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {booking.driverName && !showDriverForm ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Driver Name</p>
                  <p className="font-medium">{booking.driverName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Driver Phone</p>
                  <a href={`tel:${booking.driverPhone}`} className="font-medium text-emerald-600 hover:underline">
                    {booking.driverPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Vehicle Number</p>
                  <p className="font-medium">{booking.vehicleNumber}</p>
                </div>
                {booking.vehicleModel && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Vehicle Model</p>
                    <p className="font-medium">{booking.vehicleModel}</p>
                  </div>
                )}
              </div>
            ) : booking.status === 'ACCEPTED' || showDriverForm ? (
              <div className="space-y-4">
                {/* Driver Selection */}
                {staffDrivers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver from Staff</label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => handleDriverSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select a Driver --</option>
                      {staffDrivers.map((driver) => {
                        const isAssignedForDates = driver.isAvailableForDates === false;
                        return (
                          <option
                            key={driver.id}
                            value={driver.id}
                            disabled={!driver.isAvailable || driver.licenseExpired || isAssignedForDates}
                          >
                            {driver.name} - {driver.phone}
                            {isAssignedForDates ? ' — Assigned for these dates' : !driver.isAvailable ? ' (Unavailable)' : ''}
                            {driver.licenseExpired ? ' (License Expired)' : ''}
                          </option>
                        );
                      })}
                      <option value="manual">-- Enter Manually --</option>
                    </select>
                    {selectedDriverId && selectedDriverId !== 'manual' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Driver details auto-filled. Add vehicle info below.
                      </p>
                    )}
                  </div>
                )}

                {/* Show manual entry toggle if no staff drivers */}
                {staffDrivers.length === 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg mb-2">
                    <p className="text-sm text-amber-700">
                      No staff drivers found. <a href="/vendor/staff/add" className="underline font-medium">Add drivers</a> to your staff list for quick selection.
                    </p>
                  </div>
                )}

                {/* Vehicle Selection from Fleet */}
                {fleetVehicles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle from Fleet</label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select a Vehicle --</option>
                      {fleetVehicles.map((vehicle) => {
                        const isBookedForDates = vehicle.isAvailableForDates === false;
                        return (
                          <option
                            key={vehicle.id}
                            value={vehicle.id}
                            disabled={!vehicle.isAvailable || isBookedForDates}
                          >
                            {vehicle.brands?.name} {vehicle.chauffeur_vehicle_categories?.name}
                            {vehicle.registrationNumber ? ` - ${vehicle.registrationNumber}` : ''}
                            {vehicle.chauffeur_vehicle_categories?.seatingCapacity ? ` (${vehicle.chauffeur_vehicle_categories.seatingCapacity} Seater)` : ''}
                            {isBookedForDates ? ' — Booked for these dates' : !vehicle.isAvailable ? ' (Unavailable)' : ''}
                          </option>
                        );
                      })}
                      <option value="manual">-- Enter Manually --</option>
                    </select>
                    {selectedVehicleId && selectedVehicleId !== 'manual' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Vehicle details auto-filled below.
                      </p>
                    )}
                  </div>
                )}

                {/* No fleet vehicles message */}
                {fleetVehicles.length === 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-2">
                    <p className="text-sm text-blue-700">
                      No fleet vehicles found. <a href="/vendor/fleet/add" className="underline font-medium">Add vehicles</a> to your car-rental fleet for quick selection.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      value={driverForm.driverName}
                      onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter driver name"
                      readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone *</label>
                    <input
                      type="tel"
                      value={driverForm.driverPhone}
                      onChange={(e) => setDriverForm({ ...driverForm, driverPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter driver phone"
                      readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      value={driverForm.vehicleNumber}
                      onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., DL 01 AB 1234"
                      readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                    <input
                      type="text"
                      value={driverForm.vehicle_models}
                      onChange={(e) => setDriverForm({ ...driverForm, vehicle_models: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., Maruti Dzire"
                      readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {showDriverForm && (
                    <button
                      onClick={() => setShowDriverForm(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={booking.driverName ? handleUpdateDriver : handleAssignDriver}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : booking.driverName ? 'Update Driver' : 'Assign Driver'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No driver assigned yet</p>
            )}

            {/* OTP Note - OTP is not shown to vendor, it's sent directly to customer when driver starts trip */}
            {booking.status === 'DRIVER_ASSIGNED' && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  When the driver starts the trip, an OTP will be sent to the customer. The driver will ask the customer for the OTP to begin the trip.
                </p>
              </div>
            )}
          </div>

          {/* Trip Progress (for completed trips) */}
          {(booking.tripStartedAt || booking.tripEndedAt) && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Trip Progress
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {booking.tripStartedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trip Started</p>
                    <p className="font-medium">
                      {new Date(booking.tripStartedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {booking.tripEndedAt && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trip Ended</p>
                    <p className="font-medium">
                      {new Date(booking.tripEndedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {booking.startKmReading && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start KM Reading</p>
                    <p className="font-medium">{booking.startKmReading} km</p>
                  </div>
                )}
                {booking.endKmReading && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End KM Reading</p>
                    <p className="font-medium">{booking.endKmReading} km</p>
                  </div>
                )}
                {booking.extraKm && booking.extraKm > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Extra KM</p>
                    <p className="font-medium">{booking.extraKm} km</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Trip Form */}
          {booking.status === 'IN_PROGRESS' && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Complete Trip</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End KM Reading</label>
                  <input
                    type="number"
                    value={completeForm.endKmReading}
                    onChange={(e) => setCompleteForm({ ...completeForm, endKmReading: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter odometer reading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Hours</label>
                  <input
                    type="number"
                    value={completeForm.extraHours}
                    onChange={(e) => setCompleteForm({ ...completeForm, extraHours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toll Charges (₹)</label>
                  <input
                    type="number"
                    value={completeForm.tollCharges}
                    onChange={(e) => setCompleteForm({ ...completeForm, tollCharges: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parking Charges (₹)</label>
                  <input
                    type="number"
                    value={completeForm.parkingCharges}
                    onChange={(e) => setCompleteForm({ ...completeForm, parkingCharges: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <button
                onClick={handleCompleteTrip}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? 'Completing...' : 'Complete Trip'}
              </button>
            </div>
          )}

          {/* Customer Rating */}
          {booking.rating && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Customer Rating</h2>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-2xl ${i < booking.rating! ? 'text-amber-500' : 'text-gray-300'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              {booking.review && (
                <p className="text-gray-600 italic">&quot;{booking.review}&quot;</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Summary
            </h2>

            <div className="space-y-2.5 text-sm">
              {/* Distance / Base fare */}
              {booking.kmCharges && booking.kmCharges > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Distance Charges
                    {booking.chargeableKm ? <span className="text-xs text-gray-400 ml-1">({booking.chargeableKm} km)</span> : null}
                  </span>
                  <span>₹{booking.kmCharges.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare</span>
                  <span>₹{booking.baseFare.toLocaleString()}</span>
                </div>
              )}

              {booking.driverBatta && booking.driverBatta > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver Allowance</span>
                  <span>₹{booking.driverBatta.toLocaleString()}</span>
                </div>
              ) : null}

              {booking.nightCharges && booking.nightCharges > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Night Charges</span>
                  <span>₹{booking.nightCharges.toLocaleString()}</span>
                </div>
              ) : null}

              {booking.tollCharges && booking.tollCharges > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Toll Charges</span>
                  <span>₹{booking.tollCharges.toLocaleString()}</span>
                </div>
              ) : null}

              {booking.gstAmount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">GST</span>
                  <span>₹{booking.gstAmount.toLocaleString()}</span>
                </div>
              ) : null}

              {booking.platformFee > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span>₹{booking.platformFee.toLocaleString()}</span>
                </div>
              ) : null}

              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Grand Total</span>
                <span className="text-emerald-600">₹{booking.grandTotal.toLocaleString()}</span>
              </div>

              {/* Post-trip extra charges */}
              {booking.extraCharges && booking.extraCharges > 0 ? (
                <>
                  <div className="border-t pt-2 flex justify-between text-amber-600">
                    <span>Extra Charges</span>
                    <span>₹{booking.extraCharges.toLocaleString()}</span>
                  </div>
                  {booking.parkingCharges && booking.parkingCharges > 0 ? (
                    <div className="flex justify-between text-gray-600">
                      <span>Parking Charges</span>
                      <span>₹{booking.parkingCharges.toLocaleString()}</span>
                    </div>
                  ) : null}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Final Amount</span>
                    <span className="text-emerald-600">₹{booking.finalAmount?.toLocaleString()}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-4 pt-4 border-t">
              {booking.paidAmount && booking.paidAmount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Advance Paid</span>
                  <span className="font-medium text-emerald-600">₹{booking.paidAmount.toLocaleString()}</span>
                </div>
              )}
              {booking.paidAmount && booking.paidAmount < (booking.finalAmount || booking.grandTotal) && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Balance Remaining</span>
                  <span className="font-medium text-amber-600">
                    ₹{((booking.finalAmount || booking.grandTotal) - booking.paidAmount).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Payment Status</span>
                <span className={`font-medium ${
                  (booking.paidAmount || 0) >= (booking.finalAmount || booking.grandTotal) ? 'text-green-600' :
                  (booking.paidAmount || 0) > 0 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {(booking.paidAmount || 0) >= (booking.finalAmount || booking.grandTotal)
                    ? 'FULLY PAID'
                    : (booking.paidAmount || 0) > 0
                    ? 'ADVANCE PAID'
                    : 'PAYMENT PENDING'}
                </span>
              </div>
              {booking.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-xs">{booking.transactionId}</span>
                </div>
              )}
            </div>
          </div>


          {/* Booking Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Booking Info</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Booking Number</p>
                <p className="font-mono">{booking.bookingNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created At</p>
                <p>{new Date(booking.createdAt).toLocaleString('en-IN')}</p>
              </div>
              {booking.location && (
                <div>
                  <p className="text-xs text-gray-500">Service Location</p>
                  <p>{booking.location.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor Notes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              Vendor Notes
            </h2>

            <textarea
              value={booking.vendorNotes || ''}
              onChange={(e) => setBooking({ ...booking, vendorNotes: e.target.value })}
              placeholder="Add internal notes..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button
              onClick={() => handleAction('update_notes', { vendorNotes: booking.vendorNotes })}
              disabled={actionLoading}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && vendorDbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <VendorBookingChat
              bookingId={booking.id}
              vendorId={vendorDbId}
              vendorName={vendorName}
              customerId={booking.customerId || undefined}
              customerName={booking.customerName}
              customerEmail={booking.customerEmail}
              customerPhone={booking.customerPhone}
              isOpen={showChat}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
