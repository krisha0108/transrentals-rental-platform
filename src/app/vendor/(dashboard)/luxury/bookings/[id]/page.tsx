'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
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
  Car,
  Gift,
  Key,
  Star,
  Phone,
  MessageSquare,
  FileText,
  EllipsisVertical,
  ChevronRight,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VendorCallButton from '@/components/vendor/VendorCallButton';

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
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
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
  isAvailableForDates?: boolean;
}

interface FleetVehicle {
  id: string;
  registrationNumber: string | null;
  isAvailableForDates?: boolean;
  vehicle_models: {
    id: string;
    name: string;
    brands: { id: string; name: string } | null;
  } | null;
  chauffeur_vehicle_categories: { id: string; name: string } | null;
  brands: { id: string; name: string } | null;
  services: { id: string; name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Awaiting Advance', color: 'text-[#D4A017]', bgColor: 'bg-[#FFF9EA]', icon: Clock },
  PAYMENT_SUBMITTED: { label: 'Payment Review', color: 'text-[#4F7DF3]', bgColor: 'bg-[#EEF4FF]', icon: RefreshCw },
  ADVANCE_PAID: { label: 'Booking Confirmed', color: 'text-[#22A06B]', bgColor: 'bg-[#EAFBF3]', icon: CheckCircle },
  CONFIRMED: { label: 'Confirmed', color: 'text-[#22A06B]', bgColor: 'bg-[#EAFBF3]', icon: Crown },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'text-[#9B7CF6]', bgColor: 'bg-[#F4F0FF]', icon: User },
  IN_PROGRESS: { label: 'Trip In Progress', color: 'text-[#9B7CF6]', bgColor: 'bg-[#F4F0FF]', icon: Navigation },
  COMPLETED: { label: 'Completed', color: 'text-[#6B7280]', bgColor: 'bg-[#F3F4F6]', icon: Star },
  CANCELLED: { label: 'Cancelled', color: 'text-[#E8A1A1]', bgColor: 'bg-[#FFF0F0]', icon: XCircle },
  DROPPED: { label: 'Dropped', color: 'text-[#E8A1A1]', bgColor: 'bg-[#FFF0F0]', icon: AlertCircle },
};

const LUXURY_CATEGORIES: Record<string, string> = {
  'luxury-sedan': 'Luxury Sedan',
  'luxury-suv': 'Luxury SUV',
  'vintage': 'Vintage Car',
  'sports': 'Sports Car',
  'limousine': 'Limousine',
  'convertible': 'Convertible',
};

// Helper for dynamic icon background styling
const getVehicleStyle = (category: string | null) => {
  if (!category) return 'bg-[#FAFAFA] border-[#EEEEEE] text-[#6B7280]';
  const cat = category?.toLowerCase() || '';
  if (cat.includes('sedan')) return 'bg-[#FDF0D5]/50 border-[#FDF0D5] text-[#D4A017]'; 
  if (cat.includes('suv')) return 'bg-[#EEF4FF]/60 border-[#E0EAFF] text-[#4F7DF3]'; 
  if (cat.includes('vintage') || cat.includes('limousine') || cat.includes('premium')) return 'bg-[#FFF9EA] border-[#FDECB2]/50 text-[#C89B3C]'; 
  return 'bg-[#FAFAFA] border-[#EEEEEE] text-[#6B7280]';
};

const getOccasionStyle = (occasion: string | null) => {
  if (!occasion) return 'bg-[#F8F9FB] text-[#6B7280] border-[#EEEEEE]';
  const occ = occasion.toLowerCase();
  if (occ.includes('wedding')) return 'bg-[#FFF0F0] text-[#E8A1A1] border-[#FFE4E4]';
  if (occ.includes('romantic') || occ.includes('anniversary')) return 'bg-[#F4F0FF] text-[#9B7CF6] border-[#ECE4FF]';
  if (occ.includes('corporate') || occ.includes('business')) return 'bg-[#EEF4FF] text-[#4F7DF3] border-[#E0EFFF]';
  if (occ.includes('vip')) return 'bg-gradient-to-r from-[#FDF0D5] to-[#F1E0B0] text-[#C89B3C] border-[#F1E0B0] shadow-sm';
  return 'bg-[#F8F9FB] text-[#6B7280] border-[#EEEEEE]';
};

export default function VendorLuxuryBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

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
    vehicle_model: '',
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
    if (!id) return;
    try {
      const response = await fetch(`/api/vendor/luxury-bookings/${id}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setAssignForm({
          driverName: data.booking.driverName || '',
          driverPhone: data.booking.driverPhone || '',
          vehicleNumber: data.booking.vehicleNumber || data.booking.acceptedQuote?.vehicleNumber || '',
          vehicle_model: data.booking.vehicle_model || '',
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

  const fetchStaffDrivers = async (pickupDate?: string, returnDate?: string) => {
    try {
      let url = '/api/vendor/staff/drivers';
      if (pickupDate) {
        const startDate = new Date(pickupDate).toISOString();
        const endDate = returnDate
          ? new Date(returnDate).toISOString()
          : startDate;
        url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const drivers = data.drivers || [];
        // Sort: available drivers first, unavailable (assigned for dates) last
        drivers.sort((a: StaffDriver, b: StaffDriver) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setStaffDrivers(drivers);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
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
      const res = await fetch(fleetUrl);
      const data = await res.json();
      if (data.success && data.fleet) {
        // Filter for luxury vehicles
        const luxuryFleet = data.fleet.filter((v: FleetVehicle) => {
          const slug = v.services?.slug?.toLowerCase() || '';
          const name = v.services?.name?.toLowerCase() || '';
          return slug.includes('luxury') || name.includes('luxury');
        });
        const filteredFleet = luxuryFleet.length > 0 ? luxuryFleet : data.fleet;
        // Sort: available vehicles first, unavailable (booked for dates) last
        filteredFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
          const aUnavail = a.isAvailableForDates === false ? 1 : 0;
          const bUnavail = b.isAvailableForDates === false ? 1 : 0;
          return aUnavail - bUnavail;
        });
        setFleetVehicles(filteredFleet);
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    }
  };

  const handleFleetSelection = (vehicleId: string) => {
    if (!vehicleId) {
      setAssignForm({ ...assignForm, vehicleNumber: '', vehicle_model: '', vehicleBrand: '' });
      return;
    }

    const vehicle = fleetVehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      let vModel = '';
      let vBrand = '';
      if (vehicle.vehicle_models) {
        vBrand = vehicle.vehicle_models.brands?.name || '';
        vModel = vehicle.vehicle_models.name;
      } else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) {
        vBrand = vehicle.brands.name;
        vModel = vehicle.chauffeur_vehicle_categories.name;
      }

      setAssignForm({
        ...assignForm,
        vehicleNumber: vehicle.registrationNumber || '',
        vehicle_model: vModel,
        vehicleBrand: vBrand,
      });
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  // Fetch staff drivers and fleet vehicles with booking dates for availability check
  useEffect(() => {
    if (booking?.pickupDate) {
      fetchStaffDrivers(booking.pickupDate, booking.returnDate);
      fetchFleetVehicles(booking.pickupDate, booking.returnDate);
    } else if (booking) {
      fetchStaffDrivers();
      fetchFleetVehicles();
    }
  }, [booking?.pickupDate, booking?.id]);

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
      <div className="min-h-screen bg-[#F8F9FB] pb-12 animate-pulse">
        {/* Header Skeleton */}
        <div className="w-full bg-white border-b border-[#EEEEEE] px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-56 bg-gray-100 rounded-lg" />
                  <div className="h-7 w-24 bg-emerald-100 rounded-full" />
                </div>
                <div className="h-4 w-40 bg-gray-50 rounded" />
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-50 rounded-xl" />
          </div>
        </div>

        <div className="w-full px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column (2/3) */}
            <div className="lg:col-span-2 space-y-8">

              {/* Trip Details Card Skeleton */}
              <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-200 to-emerald-300" />
                {/* Vehicle Header */}
                <div className="p-6 flex items-center justify-between border-b border-[#EEEEEE]/50">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl" />
                    <div className="space-y-2">
                      <div className="h-6 w-44 bg-gray-100 rounded" />
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-20 bg-gray-50 rounded-lg" />
                        <div className="h-5 w-24 bg-gray-50 rounded-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-16 bg-gray-100 rounded" />
                    <div className="h-5 w-28 bg-gray-100 rounded" />
                  </div>
                </div>

                {/* Trip Details Grid */}
                <div className="p-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Left: Pickup + Drop */}
                  <div className="space-y-6">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${i === 1 ? 'bg-emerald-50' : 'bg-red-50'}`} />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 w-24 bg-gray-100 rounded" />
                          <div className="h-5 w-36 bg-gray-100 rounded" />
                          <div className="h-3.5 w-full bg-gray-50 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Right: Schedule + Decoration */}
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                        <div className="h-5 w-48 bg-gray-100 rounded" />
                        <div className="h-3.5 w-28 bg-gray-50 rounded" />
                        <div className="flex gap-2 mt-2">
                          <div className="h-7 w-16 bg-gray-50 rounded-xl" />
                          <div className="h-7 w-24 bg-gray-50 rounded-xl" />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                        <div className="h-5 w-32 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="px-8 pb-8">
                  <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-2xl p-5 space-y-2">
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                    <div className="h-4 w-full bg-gray-50 rounded" />
                    <div className="h-4 w-3/4 bg-gray-50 rounded" />
                  </div>
                </div>
              </div>

              {/* Customer & Payment Grid Skeleton */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Customer Card */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] p-8">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-5 h-5 bg-emerald-100 rounded" />
                    <div className="h-4 w-28 bg-gray-100 rounded" />
                  </div>
                  <div className="space-y-5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-5 p-4 bg-[#FAFAFA] rounded-2xl">
                        <div className="w-12 h-12 bg-white rounded-xl border border-[#EEEEEE]" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 w-16 bg-gray-100 rounded" />
                          <div className="h-4.5 w-32 bg-gray-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Card */}
                <div className="bg-white rounded-2xl border border-[#EEEEEE] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-12 -mt-12" />
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-5 h-5 bg-emerald-100 rounded" />
                    <div className="h-4 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center py-2">
                      <div className="h-4 w-32 bg-gray-100 rounded" />
                      <div className="h-7 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50/60 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg" />
                        <div className="h-4 w-20 bg-emerald-100 rounded" />
                      </div>
                      <div className="h-5 w-20 bg-emerald-100 rounded" />
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg" />
                        <div className="h-4 w-20 bg-emerald-100 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-emerald-100 rounded" />
                    </div>
                    <div className="flex justify-end pt-3">
                      <div className="h-7 w-28 bg-gray-50 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Assignment Skeleton */}
              <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden">
                <div className="p-8 border-b border-[#EEEEEE]/50 bg-[#FAFAFA]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-emerald-100 rounded" />
                    <div className="h-4 w-44 bg-gray-100 rounded" />
                  </div>
                  <div className="h-10 w-36 bg-gray-900/10 rounded-2xl" />
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex items-center gap-5 p-5 bg-[#FAFAFA] rounded-2xl">
                    <div className="w-14 h-14 bg-white rounded-xl border border-[#EEEEEE]" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-5 w-36 bg-gray-100 rounded" />
                      <div className="h-3.5 w-28 bg-gray-50 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar (1/3) */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6 space-y-3">
                <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 w-full bg-gray-50 rounded-xl" />
                ))}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6">
                <div className="h-4 w-20 bg-gray-100 rounded mb-6" />
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-emerald-100 rounded-full mt-1 flex-shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-16 bg-gray-100 rounded" />
                        <div className="h-4 w-full bg-gray-50 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat / Notes */}
              <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6">
                <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-1.5">
                      <div className="h-3 w-full bg-gray-100 rounded" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
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
        <Link href="/vendor/luxury/bookings" className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1F2A37] font-sans pb-12">
      {/* Header Premium Identity Zone */}
      <div className="w-full bg-white border-b border-[#EEEEEE] sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="w-full px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Link href="/vendor/luxury/bookings" className="w-10 h-10 bg-[#FAFAFA] hover:bg-[#F3F4F6] rounded-xl flex items-center justify-center border border-[#EEEEEE] transition-all focus:ring-2 focus:ring-[#C89B3C] outline-none group">
                <ArrowLeft className="w-5 h-5 text-[#6B7280] group-hover:text-[#1F2A37]" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-black text-[#1F2A37] tracking-tight">Booking #{booking.bookingNumber}</h1>
                  <div className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5", statusConfig.bgColor, statusConfig.color)}>
                    <statusConfig.icon className="w-4 h-4" />
                    {statusConfig.label}
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                  </div>
                </div>
                <p className="text-base text-[#6B7280] font-bold mt-1">Created on {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 mr-2">
                <VendorCallButton phone={booking.customerPhone} bookingType="luxury_booking" bookingId={booking.id} variant="gray" size="md" />
              </div>
            </div>
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

      {/* Cancellation Banner */}
      {booking.status === 'CANCELLED' && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-red-100/60 border-b border-red-200">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm font-bold text-red-800">Booking Cancelled</p>
            {booking.cancelledBy && (
              <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-200/70 text-red-700">
                by {booking.cancelledBy === 'CUSTOMER' ? 'Customer' : booking.cancelledBy === 'VENDOR' ? 'You' : 'Admin'}
              </span>
            )}
          </div>
          <div className="px-4 py-3 space-y-2">
            {booking.cancellationReason ? (
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm text-red-900 leading-relaxed">{booking.cancellationReason}</p>
              </div>
            ) : (
              <p className="text-sm text-red-600 italic">No reason provided</p>
            )}
            {booking.cancelledAt && (
              <p className="text-[11px] text-red-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Cancelled on {new Date(booking.cancelledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="w-full px-6 py-8">
        {/* Main Operational Container */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trip Detailed Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="relative h-2 bg-gradient-to-r from-[#C19736] via-[#D4A017] to-[#C19736]" />
              <div className={cn("p-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#EEEEEE]/50", getOccasionStyle(booking.occasion || ''))}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-16 h-16 rounded-2xl border flex items-center justify-center shadow-sm", getVehicleStyle(booking.carCategory))}>
                    <Crown className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#1F2A37] tracking-tight">
                      {booking.acceptedQuote?.vehicleName || booking.carCategoryName || getCategoryName(booking.carCategory)}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs font-black uppercase tracking-widest px-2.5 py-1 bg-white/50 rounded-lg border border-current/10">
                        {booking.tripType?.replace('-', ' ')}
                      </p>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
                      <p className="text-xs font-black uppercase tracking-widest opacity-80">
                        {booking.occasion || 'Premium Rental'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/40 px-4 py-2 rounded-xl border border-white/50 backdrop-blur-sm self-start">
                  <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-1">Booking Ref</p>
                  <p className="text-base font-black text-[#1F2A37]">{booking.bookingNumber}</p>
                </div>
              </div>

              <div className="p-8 grid md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EAFBF3] border border-[#E0EFE8] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-[#22A06B]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] uppercase font-black tracking-widest mb-2">Pickup Location</p>
                      <p className="text-lg font-bold text-[#1F2A37] leading-tight">{booking.pickupCity}</p>
                      {booking.pickupAddress && <p className="text-sm text-[#6B7280] mt-2 font-medium leading-relaxed">{booking.pickupAddress}</p>}
                    </div>
                  </div>

                  {booking.dropCity && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF0F0] border border-[#FFE0E0] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-[#E8A1A1]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280] uppercase font-black tracking-widest mb-2">Drop / Return</p>
                        <p className="text-lg font-bold text-[#1F2A37] leading-tight">{booking.dropCity}</p>
                        {booking.dropAddress && <p className="text-sm text-[#6B7280] mt-2 font-medium leading-relaxed">{booking.dropAddress}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF9EA] border border-[#FDECB2] flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-[#C89B3C]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280] uppercase font-black tracking-widest mb-2">Schedule</p>
                      <p className="text-lg font-bold text-[#1F2A37] leading-tight">{new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                      <p className="text-sm text-[#6B7280] mt-2 font-medium">at <span className="text-[#C89B3C] font-black">{booking.pickupTime}</span></p>
                      <div className="flex items-center gap-2 mt-4">
                        {booking.totalDays && (
                          <div className="px-3 py-1.5 bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl text-xs font-black uppercase text-[#1F2A37]">
                            {booking.totalDays} Days
                          </div>
                        )}
                        {booking.totalHours && (
                          <div className="px-3 py-1.5 bg-[#FAFAFA] border border-[#EEEEEE] rounded-xl text-xs font-black uppercase text-[#1F2A37]">
                            {booking.totalHours} Hours Package
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {booking.needDecoration && (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#F4F0FF] border border-[#ECE4FF] flex items-center justify-center flex-shrink-0">
                        <Gift className="w-6 h-6 text-[#9B7CF6]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280] uppercase font-black tracking-widest mb-2">Decoration</p>
                        <p className="text-lg font-bold text-[#1F2A37] capitalize">{booking.decorationType || 'Premium requested'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(booking.customerNotes || booking.quoteRequest?.requirements) && (
                <div className="px-8 pb-8">
                  <div className="bg-[#FAFAFA] border border-[#EEEEEE] rounded-2xl p-5 group-hover:bg-[#FDFBF7] transition-all">
                    <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-[0.1em] mb-2.5 flex items-center gap-2">
                       <AlertCircle className="w-3.5 h-3.5 text-[#C89B3C]" />
                       Special Requirements
                    </p>
                    <p className="text-sm text-[#1F2A37] font-medium leading-relaxed italic border-l-2 border-[#C89B3C]/30 pl-4">
                      "{booking.customerNotes || booking.quoteRequest?.requirements}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Payment Section */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] p-8 group hover:shadow-md transition-all">
                <h3 className="text-xs font-black text-[#6B7280] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#C89B3C]" />
                  Customer Details
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-5 p-4 bg-[#FAFAFA] rounded-2xl border border-[#EEEEEE]/50">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#EEEEEE] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#6B7280]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-1">Full Name</p>
                      <p className="text-base font-bold text-[#1F2A37]">{booking.customerName}</p>
                    </div>
                  </div>
                  {booking.customerEmail && (
                    <div className="flex items-center gap-5 p-4 bg-[#FAFAFA] rounded-2xl border border-[#EEEEEE]/50">
                      <div className="w-12 h-12 rounded-xl bg-white border border-[#EEEEEE] flex items-center justify-center">
                        <Mail className="w-6 h-6 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-1">Email Address</p>
                        <p className="text-base font-bold text-[#1F2A37] break-all">{booking.customerEmail}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-5 p-4 bg-[#FAFAFA] rounded-2xl border border-[#EEEEEE]/50">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#EEEEEE] flex items-center justify-center">
                      <Phone className="w-6 h-6 text-[#6B7280]" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-1">Phone Number</p>
                      <VendorCallButton phone={booking.customerPhone} bookingType="luxury_booking" bookingId={booking.id} variant="gray" size="md" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] p-8 group hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#EAFBF3]/50 rounded-bl-full -mr-12 -mt-12" />
                <h3 className="text-xs font-black text-[#6B7280] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C89B3C]" />
                  Financial Summary
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-2 px-1">
                    <span className="text-sm font-bold text-[#6B7280] uppercase tracking-wider">Total Booking Value</span>
                    <span className="text-2xl font-black text-[#1F2A37]">₹{booking.grandTotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#EAFBF3]/60 rounded-2xl border border-[#EAFBF3]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-4 h-4 text-[#22A06B]" />
                      </div>
                      <span className="text-sm font-bold text-[#22A06B] uppercase tracking-wider">Amount Paid</span>
                    </div>
                    <span className="text-lg font-black text-[#22A06B]">₹{(booking.advancePaid || booking.advanceAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#FFF9EA] rounded-2xl border border-[#FFF0C2]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Clock className="w-4 h-4 text-[#D4A017]" />
                      </div>
                      <span className="text-sm font-bold text-[#D4A017] uppercase tracking-wider">Balance Due</span>
                    </div>
                    <span className="text-3xl font-black text-[#D4A017]">₹{(booking.grandTotal - (booking.advancePaid || booking.advanceAmount || 0)).toLocaleString()}</span>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <div className={cn(
                      "inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                      booking.paymentStatus === 'PAID' ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-[#D4A017]/10 text-[#D4A017]'
                    )}>
                      <CreditCard className="w-4 h-4" />
                      {booking.paymentStatus}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver & Vehicle Assignment Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] overflow-hidden group hover:shadow-md transition-all">
              <div className="p-8 border-b border-[#EEEEEE]/50 flex flex-wrap items-center justify-between gap-6 bg-[#FAFAFA]/50">
                <h3 className="text-xs font-black text-[#6B7280] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C89B3C]" />
                  Driver & Vehicle Assignment
                </h3>
                {!booking.driverName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="px-6 py-3 bg-[#1F2A37] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#111827] transition-all shadow-sm hover:shadow-md flex items-center gap-2.5"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Chauffeur
                  </button>
                )}
                {booking.driverName && !showAssignForm && ['DRIVER_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="text-[#6B7280] hover:text-[#C89B3C] text-xs font-black uppercase tracking-widest flex items-center gap-2.5 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Update Details
                  </button>
                )}
              </div>

              {showAssignForm ? (
                <div className="p-10 bg-[#FAFAFA]/50 border-b-2 border-[#EEEEEE]/50 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-[#1F2A37] uppercase tracking-[0.2em] flex items-center gap-2.5">
                        <User className="w-5 h-5 text-[#C89B3C]" />
                        Chauffeur Selection
                      </label>
                      <select
                        className="w-full h-14 px-5 bg-white border border-[#EEEEEE] rounded-2xl text-base font-bold text-[#1F2A37] focus:ring-4 focus:ring-[#C89B3C]/10 focus:border-[#C89B3C] outline-none transition-all shadow-sm"
                        value={staffDrivers.find(d => d.name === assignForm.driverName)?.id || ''}
                        onChange={(e) => {
                          const driver = staffDrivers.find(d => d.id === e.target.value);
                          if (driver) {
                            setAssignForm({ ...assignForm, driverName: driver.name, driverPhone: driver.phone });
                          }
                        }}
                      >
                        <option value="">Select Staff Chauffeur</option>
                        {staffDrivers.map(driver => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} ({driver.phone})  {driver.isAvailableForDates === false ? '[Booked]' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] font-bold text-[#6B7280] ml-1">Verified staff members from your roster</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-[#1F2A37] uppercase tracking-[0.2em] flex items-center gap-2.5">
                        <Car className="w-5 h-5 text-[#C89B3C]" />
                        Luxury Fleet Selection
                      </label>
                      <select
                        className="w-full h-14 px-5 bg-white border border-[#EEEEEE] rounded-2xl text-base font-bold text-[#1F2A37] focus:ring-4 focus:ring-[#C89B3C]/10 focus:border-[#C89B3C] outline-none transition-all shadow-sm"
                        value={fleetVehicles.find(v => v.registrationNumber === assignForm.vehicleNumber)?.id || ''}
                        onChange={(e) => handleFleetSelection(e.target.value)}
                      >
                        <option value="">Select Luxury Vehicle</option>
                        {fleetVehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.registrationNumber} - {v.vehicle_models?.name} {v.isAvailableForDates === false ? '[Reserved]' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] font-bold text-[#6B7280] ml-1">Only active luxury inventory shown</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-[#1F2A37] uppercase tracking-[0.2em] flex items-center gap-2.5">
                        <Edit className="w-5 h-5 text-[#C89B3C]" />
                        Manual Vehicle Details
                      </label>
                      <input
                        type="text"
                        placeholder="Vehicle Number"
                        className="w-full h-14 px-5 bg-white border border-[#EEEEEE] rounded-2xl text-base font-bold text-[#1F2A37] focus:ring-4 focus:ring-[#C89B3C]/10 focus:border-[#C89B3C] outline-none transition-all"
                        value={assignForm.vehicleNumber}
                        onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value })}
                      />
                    </div>

                    <div className="lg:col-span-3 pt-10 border-t border-[#EEEEEE]/50 flex flex-wrap items-center gap-6">
                      <button
                        onClick={handleAssignSubmit}
                        disabled={actionLoading}
                        className="flex-1 min-w-[280px] py-5 bg-[#C89B3C] text-white text-sm font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-[#B38A35] shadow-xl hover:shadow-[#C89B3C]/30 transition-all flex items-center justify-center gap-4"
                      >
                        {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                        Confirm Deployment
                      </button>
                      <button
                        onClick={() => setShowAssignForm(false)}
                        className="px-10 py-5 bg-white border border-[#EEEEEE] text-[#6B7280] text-sm font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-[#FAFAFA] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : booking.driverName ? (
                <div className="split-card flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#EEEEEE]">
                  <div className="flex-1 p-10 group/driver">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-[#F4F6F9] rounded-2xl flex items-center justify-center shadow-sm group-hover/driver:scale-105 transition-all">
                        <User className="w-10 h-10 text-[#1F2A37]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-2">Assigned Driver</p>
                        <p className="text-2xl font-black text-[#1F2A37] tracking-tight">{booking.driverName}</p>
                        <a href={`tel:${booking.driverPhone}`} className="text-base font-bold text-[#C89B3C] flex items-center gap-2 mt-2 hover:underline">
                          <Phone className="w-4 h-4" />
                          {booking.driverPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-10 group/vehicle">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-[#FFF9EA] rounded-2xl flex items-center justify-center shadow-sm border border-[#FDECB2] group-hover/vehicle:scale-105 transition-all">
                        <Car className="w-10 h-10 text-[#C89B3C]" />
                      </div>
                      <div>
                        <p className="text-[10px] text-[#6B7280] uppercase font-black tracking-widest mb-2">Assigned Vehicle</p>
                        <p className="text-2xl font-black text-[#1F2A37] tracking-tight">{booking.vehicleNumber || 'N/A'}</p>
                        <p className="text-base font-bold text-[#6B7280] mt-1.5 line-clamp-1">{booking.vehicleBrand} {booking.vehicle_model}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 px-8 text-center bg-[#FAFAFA]/30">
                  <div className="w-20 h-20 bg-white border border-[#EEEEEE] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Users className="w-8 h-8 text-[#D1D5DB]" />
                  </div>
                  <h4 className="text-base font-black text-[#1F2A37] tracking-tight mb-2">No Chauffeur Assigned</h4>
                  <p className="text-xs text-[#6B7280] font-medium max-w-xs mx-auto leading-relaxed">Please assign a vehicle and driver to proceed with the booking operations.</p>
                  {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                    <button
                      onClick={() => setShowAssignForm(true)}
                      className="mt-8 px-8 py-3 bg-[#1F2A37] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#111827] shadow-lg transition-all"
                    >
                      Assign Now
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Status Flow Content */}
          <div className="space-y-8">
            {/* Trip Progress Timeline Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#EEEEEE] p-8 group hover:shadow-md transition-all sticky top-28">
              <h3 className="text-xs font-black text-[#1F2A37] uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
                Operational Progress
              </h3>

              {(() => {
                const isDropped = booking.status === 'DROPPED';
                const paymentDone = ['ADVANCE_PAID', 'CONFIRMED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status);
                const driverDone = !!booking.driverName;
                const tripStarted = ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);
                const completed = booking.status === 'COMPLETED';

                let droppedAfterStep = -1;
                if (isDropped) {
                  if (tripStarted) droppedAfterStep = 2;
                  else if (driverDone) droppedAfterStep = 1;
                  else if (paymentDone) droppedAfterStep = 0;
                }

                const steps = [
                  { label: 'Payment Verified', desc: 'Financial clearance', done: paymentDone, icon: <CheckCircle className="w-5 h-5" /> },
                  { label: 'Chauffeur Assigned', desc: 'Driver & car ready', done: driverDone, icon: <Users className="w-5 h-5" /> },
                  { label: 'Trip Started', desc: 'Pickup successful', done: tripStarted, icon: <Navigation className="w-5 h-5" />, time: booking.tripStartedAt },
                  { label: 'Trip Completed', desc: 'Mission accomplished', done: completed, icon: <Star className="w-5 h-5" />, time: booking.tripEndedAt },
                ];

                return (
                  <div className="space-y-0 relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#F3F4F6] -z-10" />
                    
                    {steps.map((step: any, idx: number) => {
                      const isLast = idx === steps.length - 1;
                      const isActive = step.done && (!steps[idx+1]?.done || isLast);
                      const isUpcoming = !step.done;
                      
                      return (
                        <div key={idx} className={cn("flex gap-8 pb-12 last:pb-0 relative group/step", isUpcoming && "opacity-50")}>
                          {/* Connector Line Highlight */}
                          {!isLast && step.done && (
                            <div className="absolute left-[19px] top-10 h-full w-0.5 bg-[#C89B3C] z-0" />
                          )}
                          
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500",
                            step.done ? "bg-[#C89B3C] text-white shadow-lg ring-4 ring-[#C89B3C]/10" : "bg-white border-2 border-[#EEEEEE] text-[#D1D5DB]",
                            isActive && "scale-125 ring-8 ring-[#C89B3C]/10"
                          )}>
                            {step.icon}
                          </div>

                          <div className="flex-1 pt-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className={cn(
                                "text-base font-black tracking-tight transition-colors",
                                step.done ? "text-[#1F2A37]" : "text-[#9CA3AF]"
                              )}>
                                {step.label}
                                {isActive && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#22A06B] animate-pulse" />}
                              </p>
                              {step.time && (
                                <span className="text-[10px] font-black text-[#C89B3C] bg-[#FFF9EA] px-2.5 py-1 rounded-lg border border-[#FDECB2]">
                                  {new Date(step.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-[#6B7280] mt-1.5">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}

                    {isDropped && (
                      <div className="mt-6 p-5 bg-[#FFF0F0] border border-[#FFE0E0] rounded-2xl flex items-start gap-5">
                        <XCircle className="w-6 h-6 text-[#E8A1A1] flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-[#1F2A37] uppercase tracking-widest leading-none">Trip Dropped</p>
                          <p className="text-sm font-medium text-[#E8A1A1] mt-3">{(booking as any).dropReason || 'Manually cancelled'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Area Component */}
              {booking.status === 'IN_PROGRESS' && (
                <div className="mt-10 pt-10 border-t border-[#EEEEEE] space-y-5">
                   <div className="bg-[#EEF4FF] p-5 rounded-2xl border border-[#D0E2FF] flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#4F7DF3] shadow-sm">
                        <Navigation className="w-5 h-5" />
                     </div>
                     <p className="text-xs font-bold text-[#4F7DF3] leading-relaxed">Trip is currently active. Monitor the chauffeur progress.</p>
                   </div>
                   <button
                    onClick={handleCompleteTrip}
                    disabled={actionLoading}
                    className="w-full px-6 py-5 bg-[#1F2A37] text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#111827] shadow-xl hover:shadow-[#1F2A37]/20 transition-all flex items-center justify-center gap-3.5"
                  >
                    {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    Complete Mission
                  </button>
                </div>
              )}

              <div className="mt-10">
                {booking.status === 'ADVANCE_PAID' && !booking.driverName && (
                  <div className="p-5 bg-[#FFF9EA] border border-[#FDECB2] rounded-2xl">
                    <p className="text-xs font-black text-[#D4A017] uppercase tracking-widest mb-2 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" />
                       Action Required
                    </p>
                    <p className="text-sm font-medium text-[#D4A017] leading-relaxed">Chauffeur assignment is pending. Please assign a vehicle to proceed.</p>
                  </div>
                )}
                {booking.status === 'COMPLETED' && (
                  <div className="p-5 bg-[#EAFBF3] border border-[#E0EFE8] rounded-2xl">
                    <p className="text-xs font-black text-[#22A06B] uppercase tracking-widest mb-2 flex items-center gap-2">
                       <CheckCircle className="w-4 h-4" />
                       Perfect Service
                    </p>
                    <p className="text-sm font-medium text-[#22A06B] leading-relaxed">Trip was successfully completed. Payment and feedback verified.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
