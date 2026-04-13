'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle,
  Navigation,
  Plane,
  Crown,
  Star,
  Play,
  Flag,
  Key,
  RefreshCw,
  Eye,
  Search,
  ArrowRight,
  ArrowUpRight,
  X,
} from 'lucide-react';

interface ActiveBooking {
  id: string;
  bookingNumber: string;
  tripType: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  vehiclePreference: string | null;
  specificVehicle: string | null;
  assignedVehicle: string | null;
  customerName: string;
  customerPhone: string;
  pickupCity: string;
  pickupAddress: string;
  dropCity: string | null;
  dropAddress: string | null;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number | null;
  status: string;
  chauffeurName: string | null;
  chauffeurPhone: string | null;
  startOtp: string | null;
  endOtp: string | null;
  createdAt: string;
  vehicleCategoryName?: string;
  totalHours?: number;
  totalDays?: number;
  bookingRef?: string;
  occasion?: string;
}

// Statuses that need chauffeur assignment
const AWAITING_STATUSES = ['CONFIRMED', 'ADVANCE_PAID', 'PENDING_PAYMENT', 'PAYMENT_SUBMITTED'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  CONFIRMED: {
    label: 'Confirmed',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle
  },
  ADVANCE_PAID: {
    label: 'Advance Paid',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle
  },
  PENDING_PAYMENT: {
    label: 'Payment Pending',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Clock
  },
  PAYMENT_SUBMITTED: {
    label: 'Payment Submitted',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: CheckCircle
  },
  DRIVER_ASSIGNED: {
    label: 'Driver Assigned',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: User
  },
  CHAUFFEUR_ASSIGNED: {
    label: 'Chauffeur Assigned',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: User
  },
  EN_ROUTE_PICKUP: {
    label: 'En Route to Pickup',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Navigation
  },
  ARRIVED_PICKUP: {
    label: 'Arrived at Pickup',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: MapPin
  },
  READY_FOR_PICKUP: {
    label: 'Ready for Pickup',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Navigation
  },
  TRIP_STARTED: {
    label: 'Trip in Progress',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Play
  },
  EN_ROUTE_DROP: {
    label: 'En Route to Drop',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    icon: Navigation
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    icon: Flag
  },
};

export default function VendorLuxuryActivePage() {
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  // New State for Redesign
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'AWAITING' | 'READY' | 'IN_PROGRESS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingBooking, setViewingBooking] = useState<ActiveBooking | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Driver assignment form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicle_model, setVehicleModel] = useState('');

  const getVehicleIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('suv')) return <Navigation className="w-5 h-5" />;
    if (cat.includes('sedan')) return <Car className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Status Filter
      const matchesStatus =
        activeFilter === 'ALL' ||
        (activeFilter === 'AWAITING' && AWAITING_STATUSES.includes(booking.status)) ||
        (activeFilter === 'READY' && ['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status)) ||
        (activeFilter === 'IN_PROGRESS' && ['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status));

      // Search Filter
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        booking.bookingNumber.toLowerCase().includes(searchStr) ||
        booking.customerName.toLowerCase().includes(searchStr) ||
        booking.pickupCity.toLowerCase().includes(searchStr) ||
        booking.dropCity?.toLowerCase().includes(searchStr);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, activeFilter, searchTerm]);

  const groupedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      const dateTimeA = new Date(`${a.pickupDate} ${a.pickupTime}`).getTime();
      const dateTimeB = new Date(`${b.pickupDate} ${b.pickupTime}`).getTime();
      return dateTimeA - dateTimeB;
    });

    const groups: Record<string, { bookings: ActiveBooking[], totalRevenue: number }> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrow = today + 86400000;

    sorted.forEach(booking => {
      const bDate = new Date(booking.pickupDate);
      const bDateTime = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate()).getTime();

      let label = bDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (bDateTime === today) label = 'Today — ' + bDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      else if (bDateTime === tomorrow) label = 'Tomorrow — ' + bDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      if (!groups[label]) {
        groups[label] = { bookings: [], totalRevenue: 0 };
      }
      groups[label].bookings.push(booking);
      groups[label].totalRevenue += booking.totalAmount || 0;
    });

    return groups;
  }, [filteredBookings]);

  const stats = useMemo(() => {
    const awaiting = bookings.filter(b => AWAITING_STATUSES.includes(b.status)).length;
    const ready = bookings.filter(b => ['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(b.status)).length;
    const inProgress = bookings.filter(b => ['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(b.status)).length;
    return {
      active: bookings.length,
      awaiting,
      ready,
      inProgress,
      totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setLastUpdated(new Date());

      // Fetch both confirmed and active bookings
      const [confirmedRes, activeRes] = await Promise.all([
        fetch('/api/vendor/luxury-bookings?type=confirmed'),
        fetch('/api/vendor/luxury-bookings?type=active'),
      ]);

      const confirmedData = await confirmedRes.json();
      const activeData = await activeRes.json();

      const allBookings = [
        ...(confirmedData.success ? confirmedData.bookings : []),
        ...(activeData.success ? activeData.bookings : []),
      ];

      setBookings(allBookings);
    } catch (err) {
      setError('Failed to fetch active bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAssignDriver = async (bookingId: string) => {
    if (!driverName || !driverPhone || !vehicleNumber) {
      alert('Please fill in all driver details');
      return;
    }

    setAssigningId(bookingId);

    try {
      // TODO: Create API endpoint for assigning chauffeur
      // For now, just simulate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
              ...b,
              status: 'CHAUFFEUR_ASSIGNED',
              chauffeurName: driverName,
              chauffeurPhone: driverPhone,
              assignedVehicle: vehicleNumber,
              startOtp: Math.floor(1000 + Math.random() * 9000).toString(),
            }
            : b
        )
      );

      setShowAssignModal(null);
      setDriverName('');
      setDriverPhone('');
      setVehicleNumber('');
      setVehicleModel('');
    } catch (err) {
      alert('Failed to assign chauffeur');
    } finally {
      setAssigningId(null);
    }
  };

  const handleStartTrip = async (bookingId: string, otp: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking?.startOtp !== otp) {
      alert('Invalid OTP');
      return;
    }

    // TODO: Create API endpoint for starting trip
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: 'TRIP_STARTED' }
          : b
      )
    );
  };

  const handleCompleteTrip = async (bookingId: string) => {
    // TODO: Create API endpoint for completing trip
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    alert('Trip completed successfully!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-emerald-100">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-[1.5rem]" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-emerald-100 rounded-lg" />
              <div className="h-4 w-32 bg-emerald-50 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-5 px-6 h-12 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-200">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-center space-y-1.5">
                  <div className="h-3 w-12 bg-emerald-100 rounded mx-auto" />
                  <div className="h-5 w-8 bg-emerald-100 rounded mx-auto" />
                </div>
                {i < 4 && <div className="w-px h-8 bg-emerald-200/50" />}
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar Skeleton */}
        <div className="flex flex-col xl:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-emerald-100">
          <div className="h-12 flex-1 w-full bg-emerald-50/20 rounded-[1.25rem]" />
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-28 bg-emerald-50 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Date Group Skeleton */}
        {[1, 2].map(group => (
          <div key={group} className="space-y-4">
            {/* Date Header */}
            <div className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl" />
              <div className="h-4 w-32 bg-emerald-100 rounded" />
              <div className="h-px flex-1 bg-emerald-100" />
              <div className="h-8 w-36 bg-emerald-50 rounded-xl" />
            </div>

            {/* Booking Card Skeletons */}
            {[1, 2, 3].map(card => (
              <div key={card} className="ml-5 pl-12 pr-8 py-6 bg-white rounded-[2rem] border border-emerald-50 relative">
                {/* Time Marker */}
                <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-[1.125rem] border-2 border-emerald-50" />
                  <div className="w-3 h-3 bg-emerald-100 rounded-full" />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-10">
                  {/* Route */}
                  <div className="flex-1 lg:max-w-[360px] space-y-2.5">
                    <div className="h-3.5 w-24 bg-emerald-50 rounded" />
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-32 bg-emerald-100 rounded" />
                      <div className="h-4 w-4 bg-emerald-50 rounded" />
                      <div className="h-6 w-24 bg-emerald-50 rounded" />
                    </div>
                    <div className="h-3.5 w-48 bg-emerald-50 rounded" />
                    <div className="h-6 w-20 bg-emerald-50 rounded-lg" />
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-12 pl-10 border-l border-emerald-50">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-12 bg-emerald-50 rounded" />
                        <div className="h-4 w-20 bg-emerald-100 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 bg-emerald-50 rounded-xl" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-10 bg-emerald-50 rounded" />
                        <div className="h-4 w-24 bg-emerald-100 rounded" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-right">
                      <div className="h-3 w-10 bg-emerald-50 rounded ml-auto" />
                      <div className="h-6 w-20 bg-emerald-100 rounded ml-auto" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchBookings}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      {/* 🟢 TOP LAYER: Command Overview (Amber Theme) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 p-6 rounded-[2rem] border border-emerald-500 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-colors group-hover:bg-white/10" />

        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(5,150,105,0.3)] transform -rotate-2 hover:rotate-0 transition-all duration-700 border-b-4 border-emerald-500">
            <Crown className="w-8 h-8 text-white drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Active Luxury Trips</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-white/80 bg-white/15 px-3 py-1 rounded-full border border-white/20">
                <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin text-emerald-400")} />
                Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </span>
                {stats.active} Live
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 relative z-10">
          {/* Real-time Intel (Amber Theme) */}
          <div className="flex items-center gap-5 px-6 h-12 bg-white/15 rounded-2xl border border-dashed border-white/20">
            <div className="text-center">
              <p className="text-xs text-white/60 font-medium tracking-wide">Awaiting</p>
              <p className="text-lg font-bold text-white leading-none mt-0.5">{stats.awaiting}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-xs text-white/60 font-medium tracking-wide">Ready</p>
              <p className="text-lg font-bold text-white/70 leading-none mt-0.5">{stats.ready}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-xs text-white/60 font-medium tracking-wide">In Progress</p>
              <p className="text-lg font-bold text-white/70 leading-none mt-0.5">{stats.inProgress}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-xs text-white/60 font-medium tracking-wide">Revenue</p>
              <p className="text-lg font-bold text-white leading-none mt-0.5">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <button
            onClick={() => fetchBookings()}
            className="w-12 h-12 flex items-center justify-center bg-emerald-700 border border-emerald-500 text-white/70 hover:text-white rounded-xl transition-all shadow-xl group"
          >
            <RefreshCw className={cn("w-5 h-5 group-hover:scale-110", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* 🟡 MIDDLE LAYER: Operational Controls (Amber Accent) */}
      <div className="relative z-20 bg-[#F8F9FB] py-4 animate-in fade-in duration-500">
        <div className="flex flex-col xl:flex-row items-center gap-4 bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-200/10">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
            <input
              type="text"
              placeholder="Search by Booking ID, Guest Name or Route..."
              className="w-full pl-14 pr-6 py-3.5 bg-emerald-50/20 border-2 border-transparent rounded-[1.25rem] text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:border-emerald-400/30 focus:ring-8 focus:ring-emerald-500/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:border-l xl:border-emerald-100 xl:pl-4">
            {[
              { id: 'ALL', label: 'All Active', icon: Navigation, count: stats.active },
              { id: 'AWAITING', label: 'Awaiting Chauffeur', icon: User, count: stats.awaiting },
              { id: 'READY', label: 'Ready for Pickup', icon: MapPin, count: stats.ready },
              { id: 'IN_PROGRESS', label: 'In Progress', icon: Play, count: stats.inProgress },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  activeFilter === chip.id
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 scale-[1.01]"
                    : "bg-white text-emerald-400 hover:bg-emerald-50 border border-emerald-50"
                )}
              >
                <chip.icon className={cn("w-3.5 h-3.5", activeFilter === chip.id && "text-white")} />
                {chip.label}
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-md text-xs font-bold min-w-[20px] text-center",
                  activeFilter === chip.id
                    ? "bg-white/20 text-white"
                    : "bg-emerald-50 text-emerald-500"
                )}>
                  {chip.count}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 🔵 BOTTOM LAYER: Movement Timeline (Green) */}
      <div className="space-y-8 mt-4">
        {Object.keys(groupedBookings).length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-emerald-100 shadow-xl">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner">
              <Crown className="w-12 h-12 text-emerald-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Trips</h3>
            <p className="text-sm text-emerald-400">Active luxury bookings will appear here</p>
          </div>
        ) : (
          Object.entries(groupedBookings).map(([dateLabel, data]) => (
            <div key={dateLabel} className="relative">
              {/* Date Header — compact */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">{dateLabel}</h3>
                <div className="h-px flex-1 bg-emerald-200/30" />
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-emerald-400">{data.bookings.length} {data.bookings.length === 1 ? 'Trip' : 'Trips'}</span>
                  <span className="font-bold text-emerald-600">₹{data.totalRevenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                {data.bookings.map((booking) => {
                  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
                  const vehicleName = booking.assignedVehicle || booking.specificVehicle || booking.vehiclePreference || booking.vehicleCategoryName || booking.chauffeur_vehicle_categories.replace('LUXURY_', '').replace('_', ' ');
                  const tripLabel = booking.tripType || (booking.dropCity ? 'Outstation' : 'Local Trip');

                  return (
                    <div
                      key={booking.id}
                      onClick={() => setViewingBooking(booking)}
                      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      {/* Left status accent strip */}
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full rounded-l-2xl",
                        AWAITING_STATUSES.includes(booking.status) ? 'bg-emerald-500' :
                        ['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) ? 'bg-emerald-500' :
                        ['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) ? 'bg-emerald-500' :
                        booking.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-emerald-400'
                      )} />

                      <div className="p-4 pl-5">
                        {/* Row 1: Route info + Amount + Status */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-emerald-500">#{booking.bookingNumber}</span>
                              <span className="text-gray-300">·</span>
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {booking.pickupTime}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 leading-tight">
                              {booking.pickupCity}{booking.dropCity && booking.dropCity !== booking.pickupCity ? ` → ${booking.dropCity}` : ''}
                              <span className="text-gray-400 font-medium text-sm ml-1.5">· {tripLabel}</span>
                            </h3>
                            {booking.pickupAddress && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {booking.pickupAddress}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {booking.totalAmount ? (
                              <p className="text-2xl font-black text-gray-900 tabular-nums">₹{booking.totalAmount.toLocaleString()}</p>
                            ) : (
                              <p className="text-sm font-bold text-gray-300">TBD</p>
                            )}
                            <div className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border",
                              statusConfig.bgColor, statusConfig.color,
                              statusConfig.color.replace('text-', 'border-').replace('700', '200')
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.color.replace('text-', 'bg-'))} />
                              {statusConfig.label}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: Vehicle + Guest — evenly spread */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-2 pt-2 border-t border-gray-50">
                          {/* Vehicle */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                              {getVehicleIcon(booking.chauffeur_vehicle_categories)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{vehicleName}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>

                          {/* Guest */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{booking.customerName}</p>
                              <p className="text-[10px] text-gray-400">{booking.customerPhone}</p>
                            </div>
                          </div>

                          {/* Pickup location */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{booking.pickupCity}</p>
                              <p className="text-[10px] text-gray-400 truncate">{booking.pickupAddress || 'Pickup'}</p>
                            </div>
                          </div>

                          {/* Trip type / occasion */}
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
                              <Crown className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{tripLabel}</p>
                              <p className="text-[10px] text-gray-400">{booking.occasion || 'Luxury'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Row 3: Badges + Actions */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 flex-wrap">
                          {/* Badges on left */}
                          {booking.startOtp && ['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Key className="w-3 h-3" />
                              OTP: {booking.startOtp}
                            </div>
                          )}
                          {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <Navigation className="w-3 h-3 animate-pulse" />
                              In Progress
                            </div>
                          )}
                          {booking.chauffeurName && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <User className="w-3 h-3" />
                              {booking.chauffeurName}
                            </div>
                          )}

                          {/* Actions on right */}
                          <div className="flex items-center gap-2 ml-auto">
                          {AWAITING_STATUSES.includes(booking.status) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowAssignModal(booking.id); }}
                              className="h-9 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <User className="w-3.5 h-3.5" />
                              Assign Chauffeur
                            </button>
                          )}
                          {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCompleteTrip(booking.id); }}
                              className="h-9 px-5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              Complete Trip
                            </button>
                          )}
                          <a
                            href={`tel:${booking.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center gap-1.5"
                            title="Call Guest"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold hidden sm:inline">Call</span>
                          </a>
                          <button
                            onClick={(e) => { e.stopPropagation(); setViewingBooking(booking); }}
                            className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Manage Trip
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔴 MISSION BRIEFING DRAWER (Green Finish) */}
      {viewingBooking && (
        (() => {
          const booking = viewingBooking;
          return (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={() => setViewingBooking(null)}
              />
              <div className="relative w-full max-w-3xl bg-[#F8F9FB] h-full shadow-[0_0_80px_rgba(245,158,11,0.3)] animate-in slide-in-from-right duration-700 overflow-y-auto border-l border-emerald-200/30">
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-emerald-100 p-8 flex items-center justify-between z-20">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-xl border-b-2 border-emerald-500">
                      <Crown className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Booking {booking.bookingNumber}</h2>
                      </div>
                      <p className="text-sm text-emerald-500 font-medium">{booking.customerName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingBooking(null)}
                    className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-emerald-100 shadow-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Category</p>
                      <p className="text-lg font-bold text-gray-900 tracking-tight">
                        {booking.assignedVehicle || booking.specificVehicle || booking.vehiclePreference || booking.vehicleCategoryName || booking.chauffeur_vehicle_categories.replace('_', ' ')}
                      </p>
                      {booking.assignedVehicle && (
                        <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5" />{booking.assignedVehicle}
                        </p>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-3xl border-t-4 border-emerald-500 shadow-xl">
                      <p className="text-[10px] font-black text-white/80 mb-2 uppercase tracking-widest">Total Amount</p>
                      {booking.totalAmount ? (
                        <p className="text-2xl font-black text-white tracking-tighter">₹{booking.totalAmount.toLocaleString()}</p>
                      ) : (
                        <p className="text-lg font-bold text-white/80 italic">Price TBD</p>
                      )}
                    </div>
                  </div>

                  {/* Pickup Schedule + Trip Type */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Pickup Schedule</p>
                      <p className="text-lg font-bold text-gray-900 tracking-tight">
                        {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />{booking.pickupTime}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm">
                      <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Trip Type</p>
                      <p className="text-lg font-bold text-gray-900 uppercase tracking-tight">{booking.tripType || 'Chauffeur'}</p>
                      {booking.occasion && (
                        <p className="text-sm font-bold text-emerald-500 mt-1 uppercase tracking-wide">{booking.occasion}</p>
                      )}
                    </div>
                  </div>

                  {/* OTP Display */}
                  {booking.startOtp && ['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) && (
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 p-6 rounded-3xl border border-emerald-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-emerald-500 mb-1">Trip Start OTP</p>
                          <p className="text-3xl font-bold text-emerald-700 tracking-widest font-mono">{booking.startOtp}</p>
                        </div>
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                          <Key className="w-7 h-7 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-sm text-emerald-500 mt-3 font-bold">Share this OTP with your chauffeur to start the trip</p>
                    </div>
                  )}

                  {/* Trip In Progress Banner */}
                  {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Trip in Progress</p>
                        <p className="text-sm text-emerald-500 mt-0.5">Trip is currently active and in transit</p>
                      </div>
                    </div>
                  )}

                  {/* Chauffeur Info Banner */}
                  {['DRIVER_ASSIGNED', 'CHAUFFEUR_ASSIGNED', 'READY_FOR_PICKUP', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) && !['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 flex items-center gap-3">
                      <span className="text-lg">🚗</span>
                      <p className="text-xs font-bold text-emerald-700">Trip will be started by your assigned chauffeur. You will see all status updates here.</p>
                    </div>
                  )}

                  {/* Guest Contact */}
                  <div className="bg-white p-6 rounded-3xl border border-emerald-50 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-2xl -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-black text-emerald-400 mb-3 uppercase tracking-widest">Guest Contact</p>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">{booking.customerName}</p>
                        <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />{booking.customerPhone}
                        </p>
                      </div>
                      <a href={`tel:${booking.customerPhone}`} className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group/call">
                        <Phone className="w-5 h-5 group-hover/call:scale-110 transition-transform" />
                      </a>
                    </div>
                  </div>

                  {/* Strategic Roadmap */}
                  <div className="bg-white p-8 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors" />
                    <h4 className="text-[10px] font-black text-emerald-400 mb-6 flex items-center gap-2 relative z-10 uppercase tracking-widest">
                      <Navigation className="w-4 h-4 text-emerald-500" />
                      Strategic Timeline
                    </h4>
                    <div className="space-y-12 relative z-10 ml-2">
                      <div className="relative pl-10 border-l border-dashed border-emerald-200 pb-1">
                        <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 shadow-lg ring-4 ring-emerald-50" />
                        <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Pickup Origin</p>
                        <p className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">{booking.pickupAddress || booking.pickupCity}</p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{booking.pickupCity}</p>
                      </div>
                      <div className="relative pl-10 pt-2">
                        <div className="absolute left-[-6px] top-4 w-3 h-3 rounded-full bg-emerald-900 shadow-lg ring-4 ring-emerald-100" />
                        <p className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-widest">Drop-off Destination</p>
                        <p className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">{booking.dropAddress || booking.dropCity || 'Local Deployment'}</p>
                        {booking.dropCity && booking.dropAddress && <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{booking.dropCity}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-50/30 rounded-full blur-2xl -mr-12 -mb-12" />
                    <h3 className="text-[10px] font-black mb-5 text-emerald-400 uppercase tracking-[0.2em]">Chauffeur & Fleet Details</h3>

                    {AWAITING_STATUSES.includes(booking.status) ? (
                      <div className="space-y-6 text-center py-4">
                        <p className="text-xs font-bold text-gray-400 leading-relaxed italic uppercase tracking-widest">Deployment selection pending</p>
                        <button
                          onClick={() => { setViewingBooking(null); setShowAssignModal(booking.id); }}
                          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
                        >
                          <User className="w-4 h-4" />
                          Deploy Chauffeur
                        </button>
                      </div>
                    ) : booking.chauffeurName ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-5 p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-emerald-100 group-hover:rotate-6 transition-transform">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-emerald-400 mb-1 uppercase tracking-widest">Assigned Specialist</p>
                            <p className="text-lg font-bold text-gray-900 tracking-tight leading-none mb-1">{booking.chauffeurName}</p>
                            <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1 uppercase tracking-wider leading-none">
                              <Phone className="w-3 h-3 text-emerald-500" />{booking.chauffeurPhone}
                            </p>
                            {booking.assignedVehicle && (
                              <p className="text-[10px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1.5 uppercase tracking-[0.15em] leading-none">
                                <Car className="w-3.5 h-3.5 text-emerald-600" /> {booking.assignedVehicle}
                              </p>
                            )}
                          </div>
                          <a href={`tel:${booking.chauffeurPhone}`} className="w-11 h-11 bg-white rounded-xl flex items-center justify-center border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group/call">
                            <Phone className="w-5 h-5 group-hover/call:scale-110 transition-transform" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-gray-400 text-center py-6 uppercase tracking-widest italic">Inventory Records Unassigned</p>
                    )}
                  </div>

                  {/* Complete Trip Button */}
                  {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                    <button
                      onClick={() => { handleCompleteTrip(booking.id); setViewingBooking(null); }}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-base font-bold rounded-xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95"
                    >
                      <Flag className="w-5 h-5 text-green-200" />
                      Complete Trip
                    </button>
                  )}

                  <Link
                    href={`/vendor/luxury/bookings/${booking.id}`}
                    className="flex items-center justify-center gap-4 w-full py-4 bg-white border-2 border-emerald-600 text-gray-900 rounded-xl text-xs font-black uppercase tracking-[0.3em] hover:bg-emerald-600 hover:text-white transition-all shadow-xl group mb-6 active:scale-95"
                  >
                    View Full Details
                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* 🟣 FLEET DEPLOYMENT MODAL (Amber Theme) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-2xl z-[120] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] max-w-xl w-full p-12 shadow-[0_40px_100px_rgba(245,158,11,0.2)] animate-in zoom-in-95 duration-700 relative overflow-hidden border border-emerald-200/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-bl-full -mr-32 -mt-32 -z-10 shadow-inner" />

            <div className="flex items-center gap-8 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-xl transform -rotate-12 border-b-4 border-emerald-500">
                <Star className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase">Fleet Deployment</h2>
                <p className="text-[10px] font-black text-emerald-400 mt-1 uppercase tracking-widest">Asset & Specialist Matching</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-900 ml-1 uppercase tracking-widest leading-none">Chauffeur Specialist *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="ENTER FULL NAME"
                    className="w-full pl-12 pr-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:ring-8 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-emerald-900 ml-1 uppercase tracking-widest leading-none">Secure Communication *</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="+91 MOBILE NUMBER"
                    className="w-full pl-12 pr-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:ring-8 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-900 ml-1 uppercase tracking-widest leading-none">Registration ID *</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="DL 01 AB 1234"
                    className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:ring-8 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none uppercase"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-emerald-900 ml-1 uppercase tracking-widest leading-none">Machine Model</label>
                  <input
                    type="text"
                    value={vehicle_model}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    placeholder="MERCEDES / BMW"
                    className="w-full px-6 py-4 bg-emerald-50/30 border border-emerald-100 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:ring-8 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-12">
              <button
                onClick={() => handleAssignDriver(showAssignModal)}
                disabled={assigningId === showAssignModal || !driverName || !driverPhone || !vehicleNumber}
                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white font-black text-xs uppercase tracking-[0.3em] rounded-xl hover:scale-[1.02] transition-all shadow-2xl shadow-emerald-300/50 flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              >
                {assigningId === showAssignModal ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Deployment
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAssignModal(null)}
                className="w-full py-4 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-900 transition-all"
              >
                Abort Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
