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
  Copy,
  Check,
  IndianRupee,
  Route,
  ChevronRight,
  Star,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  parkingCharges?: number;
  finalAmount?: number;
  customerNotes?: string;
  vendorNotes?: string;
  rating?: number;
  review?: string;
  acceptedVendorId?: string;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING_VENDOR: { label: 'New Booking', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  BROADCASTED: { label: 'Open', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: AlertCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Car },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
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
  const [vendorNotesInput, setVendorNotesInput] = useState('');
  const [copiedBookingNum, setCopiedBookingNum] = useState(false);

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
        setVendorNotesInput('');
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
        drivers.sort((a, b) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setStaffDrivers(drivers);
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
        const carRentalVehicles = (data.fleet || []).filter(
          (v: FleetVehicle) => {
            return v.services?.slug === 'car-rental' && v.isActive;
          }
        );
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
        vehicleNumber: driverForm.vehicleNumber,
        vehicle_models: driverForm.vehicle_models,
      });
    }
  };

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

  useEffect(() => {
    if (booking?.pickupDate) {
      fetchDrivers(booking.pickupDate, booking.returnDate);
      fetchFleetVehicles(booking.pickupDate, booking.returnDate);
    } else if (booking) {
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

  const copyBookingNumber = () => {
    navigator.clipboard.writeText(booking?.bookingNumber || '');
    setCopiedBookingNum(true);
    setTimeout(() => setCopiedBookingNum(false), 2000);
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

  if (!booking) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking not found</h2>
        <p className="text-gray-500 mb-6">The booking you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button asChild variant="outline">
          <Link href="/vendor/car-rental/bookings">
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_VENDOR;
  const StatusIcon = statusConfig.icon;

  const paymentProgress = booking.paidAmount
    ? Math.min(100, (booking.paidAmount / (booking.finalAmount || booking.grandTotal)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with gradient banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-5 sm:p-6 text-white shadow-lg shadow-emerald-200/50">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

        <Link
          href="/vendor/car-rental/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors mb-3 relative z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{booking.bookingNumber}</h1>
                <button
                  onClick={copyBookingNumber}
                  className="text-white/60 hover:text-white transition-colors"
                  title="Copy booking number"
                >
                  {copiedBookingNum ? (
                    <Check className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-white/70">
                Created {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {booking.location && <span> &middot; {booking.location.name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/20 text-white">
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
            {vendorDbId && ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
              <button
                onClick={() => setShowChat(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropped Banner */}
      {booking.status === 'DROPPED' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/40 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <XCircle className="w-5 h-5 text-white" />
          </div>
          <div className="relative z-10">
            <p className="font-bold text-red-800">This booking has been dropped</p>
            {(booking as any).dropReason && (
              <p className="text-sm text-red-600 mt-1">Reason: {(booking as any).dropReason}</p>
            )}
            {(booking as any).droppedAt && (
              <p className="text-xs text-red-400 mt-1">
                Dropped on: {new Date((booking as any).droppedAt).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Accept / Reject Actions - prominent when pending */}
      {!booking.acceptedVendorId && ['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50 p-5 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200/50">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Action Required</p>
                <p className="text-sm text-gray-600">Accept or reject this booking request</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleAction('accept')}
                disabled={actionLoading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-md shadow-emerald-200/50 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Accept Booking
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter reason for rejection:');
                  if (reason) handleAction('reject', { reason });
                }}
                disabled={actionLoading}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 transition-all font-semibold disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Trip Details Card */}
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Route className="w-4 h-4 text-white" />
                  </div>
                  Trip Details
                </CardTitle>
              </div>
              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60 shadow-sm">
                  <Navigation className="w-3 h-3" />
                  {TRIP_TYPE_LABELS[booking.tripType] || booking.tripType}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60 shadow-sm">
                  <Car className="w-3 h-3" />
                  {booking.carCategoryName}
                </span>
                {booking.totalDays && booking.totalDays > 1 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200/60 shadow-sm">
                    <Calendar className="w-3 h-3" />
                    {booking.totalDays} Days
                  </span>
                )}
                {booking.localPackageHours && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200/60 shadow-sm">
                    <Clock className="w-3 h-3" />
                    {booking.localPackageHours}hrs / {booking.localPackageKm}km
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Route visualization */}
              {(() => {
                const stops = (booking.intermediateStops || []).filter((s) => s.cityText);
                const allPoints = [
                  { city: booking.pickupCity, address: booking.pickupAddress, type: 'pickup' },
                  ...stops.map((s) => ({ city: s.cityText, address: undefined, type: 'stop' })),
                  { city: booking.dropCity || booking.pickupCity, address: booking.dropAddress, type: 'drop' },
                ];
                const showDrop = booking.dropCity && booking.dropCity !== booking.pickupCity || stops.length > 0;
                const points = showDrop ? allPoints : [allPoints[0]];

                return (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-100">
                    <div className="relative">
                      {points.length > 1 && (
                        <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-400 via-gray-200 to-red-400 rounded-full" />
                      )}
                      <div className="space-y-6">
                        {points.map((pt, i) => (
                          <div key={i} className="flex items-start gap-4">
                            <div className={cn(
                              'w-6 h-6 rounded-full flex-shrink-0 mt-0.5 border-[3px] border-white shadow-lg relative z-10 ring-2',
                              i === 0 ? 'bg-emerald-500 ring-emerald-200' :
                              i === points.length - 1 ? 'bg-red-500 ring-red-200' :
                              'bg-emerald-400 ring-emerald-200'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900">{pt.city}</p>
                              {pt.address && (
                                <p className="text-sm text-gray-500 truncate mt-0.5">{pt.address}</p>
                              )}
                              {i === 0 && (
                                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                  <p className="text-xs text-emerald-700 font-semibold">
                                    {new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} &middot; {booking.pickupTime}
                                  </p>
                                </div>
                              )}
                              {i === points.length - 1 && booking.returnDate && (
                                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-red-50 rounded-lg border border-red-100">
                                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                                  <p className="text-xs text-red-600 font-semibold">
                                    Return: {new Date(booking.returnDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {booking.chargeableKm && booking.chargeableKm > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-200/60 flex items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-gray-200 font-bold text-gray-900 shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {booking.chargeableKm} km
                        </span>
                        {booking.perKmRate && (
                          <span className="text-gray-500 font-medium">@ ₹{booking.perKmRate}/km</span>
                        )}
                        {stops.length > 0 && (
                          <span className="text-gray-400 text-xs font-medium">{stops.length + 1} legs &middot; Multi-Stop</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Date info for local trips */}
              {!booking.dropCity && !booking.intermediateStops?.length && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-500">{booking.pickupTime}</p>
                  </div>
                </div>
              )}

              {booking.customerNotes && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-amber-700 mb-1 uppercase tracking-wide">Customer Notes</p>
                  <p className="text-sm text-gray-700">{booking.customerNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Details Card */}
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200/40">
                  <span className="text-white font-bold text-xl">
                    {booking.customerName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg">{booking.customerName}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {booking.customerPhone}
                    </a>
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {booking.customerEmail}
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver & Vehicle Card */}
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Car className="w-4 h-4 text-white" />
                  </div>
                  Driver & Vehicle
                </CardTitle>
                {booking.driverName && ['ACCEPTED', 'DRIVER_ASSIGNED'].includes(booking.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDriverForm(!showDriverForm)}
                    className="text-emerald-600 hover:text-emerald-700 gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {booking.driverName && !showDriverForm ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-500 font-medium uppercase tracking-wider">Driver</p>
                        <p className="font-semibold text-gray-900">{booking.driverName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Phone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-500 font-medium uppercase tracking-wider">Phone</p>
                        <a href={`tel:${booking.driverPhone}`} className="font-semibold text-emerald-600 hover:underline">
                          {booking.driverPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Car className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] text-emerald-500 font-medium uppercase tracking-wider">Vehicle No.</p>
                        <p className="font-semibold text-gray-900">{booking.vehicleNumber}</p>
                      </div>
                    </div>
                  </div>
                  {booking.vehicleModel && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[11px] text-amber-500 font-medium uppercase tracking-wider">Model</p>
                          <p className="font-semibold text-gray-900">{booking.vehicleModel}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : booking.status === 'ACCEPTED' || showDriverForm ? (
                <div className="space-y-4">
                  {/* Driver Selection */}
                  {staffDrivers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Driver from Staff</label>
                      <select
                        value={selectedDriverId}
                        onChange={(e) => handleDriverSelect(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
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
                        <p className="text-xs text-emerald-600 mt-1.5">Driver details auto-filled. Add vehicle info below.</p>
                      )}
                    </div>
                  )}

                  {staffDrivers.length === 0 && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                      <p className="text-sm text-amber-700">
                        No staff drivers found. <a href="/vendor/staff/add" className="underline font-medium">Add drivers</a> to your staff list for quick selection.
                      </p>
                    </div>
                  )}

                  {/* Vehicle Selection from Fleet */}
                  {fleetVehicles.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Vehicle from Fleet</label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => handleVehicleSelect(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
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
                        <p className="text-xs text-emerald-600 mt-1.5">Vehicle details auto-filled below.</p>
                      )}
                    </div>
                  )}

                  {fleetVehicles.length === 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                      <p className="text-sm text-emerald-700">
                        No fleet vehicles found. <a href="/vendor/fleet/add" className="underline font-medium">Add vehicles</a> to your car-rental fleet for quick selection.
                      </p>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver Name *</label>
                      <input
                        type="text"
                        value={driverForm.driverName}
                        onChange={(e) => setDriverForm({ ...driverForm, driverName: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="Enter driver name"
                        readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Driver Phone *</label>
                      <input
                        type="tel"
                        value={driverForm.driverPhone}
                        onChange={(e) => setDriverForm({ ...driverForm, driverPhone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="Enter driver phone"
                        readOnly={selectedDriverId !== '' && selectedDriverId !== 'manual'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number *</label>
                      <input
                        type="text"
                        value={driverForm.vehicleNumber}
                        onChange={(e) => setDriverForm({ ...driverForm, vehicleNumber: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="e.g., DL 01 AB 1234"
                        readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model</label>
                      <input
                        type="text"
                        value={driverForm.vehicle_models}
                        onChange={(e) => setDriverForm({ ...driverForm, vehicle_models: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                        placeholder="e.g., Maruti Dzire"
                        readOnly={selectedVehicleId !== '' && selectedVehicleId !== 'manual'}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {showDriverForm && (
                      <Button
                        variant="outline"
                        onClick={() => setShowDriverForm(false)}
                        className="rounded-xl"
                      >
                        Cancel
                      </Button>
                    )}
                    <button
                      onClick={booking.driverName ? handleUpdateDriver : handleAssignDriver}
                      disabled={actionLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold text-sm shadow-md shadow-emerald-200/50 disabled:opacity-50"
                    >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {booking.driverName ? 'Update Driver' : 'Assign Driver'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Car className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No driver assigned yet</p>
                </div>
              )}

              {booking.status === 'DRIVER_ASSIGNED' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2 bg-emerald-50 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-emerald-700">
                      When the driver starts the trip, an OTP will be sent to the customer. The driver will ask the customer for the OTP to begin the trip.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Progress */}
          {(booking.tripStartedAt || booking.tripEndedAt) && (
            <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Trip Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid sm:grid-cols-2 gap-3">
                  {booking.tripStartedAt && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <p className="text-[11px] font-medium text-green-500 uppercase tracking-wider mb-1">Trip Started</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(booking.tripStartedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                  {booking.tripEndedAt && (
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                      <p className="text-[11px] font-medium text-red-500 uppercase tracking-wider mb-1">Trip Ended</p>
                      <p className="font-bold text-gray-900 text-sm">
                        {new Date(booking.tripEndedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                  {booking.startKmReading && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Start KM</p>
                      <p className="font-bold text-gray-900 text-lg">{booking.startKmReading} <span className="text-sm font-medium text-gray-500">km</span></p>
                    </div>
                  )}
                  {booking.endKmReading && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">End KM</p>
                      <p className="font-bold text-gray-900 text-lg">{booking.endKmReading} <span className="text-sm font-medium text-gray-500">km</span></p>
                    </div>
                  )}
                  {booking.extraKm && booking.extraKm > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-[11px] font-medium text-amber-500 uppercase tracking-wider mb-1">Extra KM</p>
                      <p className="font-bold text-gray-900 text-lg">{booking.extraKm} <span className="text-sm font-medium text-gray-500">km</span></p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Trip Form */}
          {booking.status === 'IN_PROGRESS' && (
            <Card className="overflow-hidden border-2 border-green-200 shadow-md shadow-green-100/30">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  Complete Trip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End KM Reading</label>
                    <input
                      type="number"
                      value={completeForm.endKmReading}
                      onChange={(e) => setCompleteForm({ ...completeForm, endKmReading: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      placeholder="Enter odometer reading"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Extra Hours</label>
                    <input
                      type="number"
                      value={completeForm.extraHours}
                      onChange={(e) => setCompleteForm({ ...completeForm, extraHours: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Toll Charges (₹)</label>
                    <input
                      type="number"
                      value={completeForm.tollCharges}
                      onChange={(e) => setCompleteForm({ ...completeForm, tollCharges: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Parking Charges (₹)</label>
                    <input
                      type="number"
                      value={completeForm.parkingCharges}
                      onChange={(e) => setCompleteForm({ ...completeForm, parkingCharges: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCompleteTrip}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold text-sm shadow-md shadow-green-200/50 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Complete Trip
                </button>
              </CardContent>
            </Card>
          )}

          {/* Customer Rating */}
          {booking.rating && (
            <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
              <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-emerald-50 border-b border-emerald-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                  Customer Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex items-center gap-1.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-7 h-7 transition-colors',
                        i < booking.rating! ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-gray-200'
                      )}
                    />
                  ))}
                  <span className="ml-2 text-base font-bold text-gray-900">{booking.rating}<span className="text-gray-400 font-normal">/5</span></span>
                </div>
                {booking.review && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-sm text-gray-700 italic leading-relaxed">&quot;{booking.review}&quot;</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <CardTitle className="text-base flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-white" />
                </div>
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 pt-5">
              <div className="space-y-2.5 text-sm">
                {booking.kmCharges && booking.kmCharges > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Distance Charges
                      {booking.chargeableKm ? <span className="text-xs ml-1">({booking.chargeableKm} km)</span> : null}
                    </span>
                    <span className="font-medium">₹{booking.kmCharges.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Base Fare</span>
                    <span className="font-medium">₹{booking.baseFare.toLocaleString()}</span>
                  </div>
                )}

                {booking.driverBatta && booking.driverBatta > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver Allowance</span>
                    <span className="font-medium">₹{booking.driverBatta.toLocaleString()}</span>
                  </div>
                ) : null}

                {booking.nightCharges && booking.nightCharges > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Night Charges</span>
                    <span className="font-medium">₹{booking.nightCharges.toLocaleString()}</span>
                  </div>
                ) : null}

                {booking.tollCharges && booking.tollCharges > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Toll Charges</span>
                    <span className="font-medium">₹{booking.tollCharges.toLocaleString()}</span>
                  </div>
                ) : null}

                {booking.gstAmount > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST</span>
                    <span className="font-medium">₹{booking.gstAmount.toLocaleString()}</span>
                  </div>
                ) : null}

                {booking.platformFee > 0 ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee</span>
                    <span className="font-medium">₹{booking.platformFee.toLocaleString()}</span>
                  </div>
                ) : null}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 -mx-6 px-6 py-3 border-y border-emerald-100">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="font-bold text-lg text-emerald-600">₹{booking.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {booking.extraCharges && booking.extraCharges > 0 ? (
                  <>
                    <div className="flex justify-between text-amber-600">
                      <span>Extra Charges</span>
                      <span className="font-medium">₹{booking.extraCharges.toLocaleString()}</span>
                    </div>
                    {booking.parkingCharges && booking.parkingCharges > 0 ? (
                      <div className="flex justify-between text-gray-500">
                        <span>Parking Charges</span>
                        <span className="font-medium">₹{booking.parkingCharges.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="border-t pt-3 flex justify-between font-bold text-lg">
                      <span>Final Amount</span>
                      <span className="text-emerald-600">₹{booking.finalAmount?.toLocaleString()}</span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Payment Progress */}
              <div className="mt-5 pt-4 border-t space-y-3">
                {booking.paidAmount != null && booking.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Paid</span>
                      <span className="font-semibold text-emerald-600">₹{booking.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2.5 rounded-full transition-all shadow-sm"
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                  </>
                )}
                {booking.paidAmount && booking.paidAmount < (booking.finalAmount || booking.grandTotal) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Balance</span>
                    <span className="font-semibold text-amber-600">
                      ₹{((booking.finalAmount || booking.grandTotal) - booking.paidAmount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={cn(
                    'font-semibold text-xs px-2 py-0.5 rounded-full',
                    (booking.paidAmount || 0) >= (booking.finalAmount || booking.grandTotal)
                      ? 'bg-green-100 text-green-700'
                      : (booking.paidAmount || 0) > 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  )}>
                    {(booking.paidAmount || 0) >= (booking.finalAmount || booking.grandTotal)
                      ? 'FULLY PAID'
                      : (booking.paidAmount || 0) > 0
                      ? 'ADVANCE PAID'
                      : 'PENDING'}
                  </span>
                </div>
                {booking.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-600">{booking.transactionId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Info */}
          <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
            <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                Booking Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Booking No.</span>
                  <span className="font-mono font-bold text-sm text-gray-900">{booking.bookingNumber}</span>
                </div>
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Created</span>
                  <span className="font-medium text-sm text-gray-900">{new Date(booking.createdAt).toLocaleString('en-IN')}</span>
                </div>
                {booking.location && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</span>
                    <span className="font-medium text-sm text-gray-900">{booking.location.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Notes - only after booking is accepted */}
          {booking.acceptedVendorId && ['ACCEPTED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status) && (
            <Card className="overflow-hidden border-0 shadow-md shadow-gray-200/50">
              <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  Notes to Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {/* All sent notes thread */}
                {(() => {
                  let notes: { text: string; sentAt: string }[] = [];
                  try {
                    if (booking.vendorNotes) {
                      const parsed = JSON.parse(booking.vendorNotes);
                      notes = Array.isArray(parsed) ? parsed : [{ text: booking.vendorNotes, sentAt: '' }];
                    }
                  } catch {
                    if (booking.vendorNotes) notes = [{ text: booking.vendorNotes, sentAt: '' }];
                  }
                  if (notes.length === 0) return <p className="text-xs text-gray-400">No notes sent yet.</p>;
                  return (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notes.map((n, i) => (
                        <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-sm text-emerald-900 whitespace-pre-line">{n.text}</p>
                          {n.sentAt && (
                            <p className="text-xs text-emerald-500 mt-1 text-right">
                              {new Date(n.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* New note input */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-1">Write a new note (visible to customer)</p>
                  <textarea
                    value={vendorNotesInput}
                    onChange={(e) => setVendorNotesInput(e.target.value)}
                    placeholder="Add a note for the customer..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={() => {
                      handleAction('update_notes', { vendorNotes: vendorNotesInput });
                      setVendorNotesInput('');
                    }}
                    disabled={actionLoading || !vendorNotesInput.trim()}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium text-sm shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Note'}
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
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
