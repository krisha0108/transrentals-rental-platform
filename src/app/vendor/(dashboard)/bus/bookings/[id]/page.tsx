'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Bus,
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
    FileText,
    Edit,
    RefreshCw,
    Users,
    Eye,
} from 'lucide-react';
import { BUS_CATEGORIES, BUS_TRIP_TYPES } from '@/lib/bus-categories';

interface BusBooking {
    id: string;
    bookingNumber: string;
    tripType: string;
    vehicleCategory: string;
    vehicleName: string;
    passengers: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    pickupCity: string;
    pickupAddress?: string;
    dropCity?: string;
    dropAddress?: string;
    routeDetails?: string;
    pickupDate: string;
    pickupTime: string;
    returnDate?: string;
    returnTime?: string;
    tripDays: number;
    baseAmount: number;
    totalAmount: number;
    advanceAmount: number;
    advancePaid: number;
    paymentStatus: string;
    status: string;
    assignedVehicleId?: string;
    vehicleNumber?: string;
    vehicle_model?: string;
    driverName?: string;
    driverPhone?: string;
    driverPhoto?: string;
    tripStartOtp?: string;
    tripEndOtp?: string;
    tripStartedAt?: string;
    tripEndedAt?: string;
    customerNotes?: string;
    vendorNotes?: string;
    advancePaymentRef?: string;
    advancePaymentProof?: string;
    advancePaymentVerified: boolean;
    cancelledAt?: string;
    cancelledBy?: string;
    cancellationReason?: string;
    createdAt: string;
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
        brands: {
            id: string;
            name: string;
        } | null;
    } | null;
    chauffeur_vehicle_categories: {
        id: string;
        name: string;
    } | null;
    brands: {
        id: string;
        name: string;
    } | null;
    services: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING_PAYMENT: { label: 'Awaiting Advance', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    PAYMENT_SUBMITTED: { label: 'Payment Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    ADVANCE_PAID: { label: 'Booking Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
    VEHICLE_ASSIGNED: { label: 'Driver Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    IN_PROGRESS: { label: 'Trip Started', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
    DROPPED: { label: 'Dropped', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export default function VendorBusBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [booking, setBooking] = useState<BusBooking | null>(null);
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
        assignedVehicleId: '',
    });

    const [staffDrivers, setStaffDrivers] = useState<StaffDriver[]>([]);
    const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);

    const fetchBooking = async () => {
        try {
            const response = await fetch(`/api/vendor/bus-bookings/${id}`);
            const data = await response.json();

            if (data.success) {
                setBooking(data.booking);
                // Pre-fill form from booking details
                setAssignForm({
                    driverName: data.booking.driverName || '',
                    driverPhone: data.booking.driverPhone || '',
                    vehicleNumber: data.booking.vehicleNumber || '',
                    vehicle_models: data.booking.vehicle_models || '',
                    assignedVehicleId: data.booking.assignedVehicleId || '',
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
            let driversUrl = '/api/vendor/staff/drivers';
            if (pickupDate) {
                const startDate = new Date(pickupDate).toISOString();
                const endDate = returnDate
                    ? new Date(returnDate).toISOString()
                    : startDate;
                driversUrl += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            }
            const driversRes = await fetch(driversUrl);
            const driversData = await driversRes.json();

            if (driversData.success) {
                const drivers: StaffDriver[] = driversData.drivers || [];
                // Sort: available drivers first, unavailable (assigned for dates) last
                drivers.sort((a, b) => {
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
            const fleetRes = await fetch(fleetUrl);
            const fleetData = await fleetRes.json();
            if (fleetData.success && fleetData.fleet) {
                // Filter for bus rental vehicles only
                const busFleet = fleetData.fleet.filter((v: FleetVehicle) => {
                    if (!v.isActive) return false;
                    const slug = v.services?.slug?.toLowerCase() || '';
                    const name = v.services?.name?.toLowerCase() || '';
                    return slug.includes('bus') || name.includes('bus');
                });
                // Sort: available vehicles first, unavailable (booked for dates) last
                busFleet.sort((a: FleetVehicle, b: FleetVehicle) => {
                    const aUnavail = a.isAvailableForDates === false ? 1 : 0;
                    const bUnavail = b.isAvailableForDates === false ? 1 : 0;
                    return aUnavail - bUnavail;
                });
                setFleetVehicles(busFleet);
            }
        } catch (err) {
            console.error('Failed to fetch fleet:', err);
        }
    };

    // Handle fleet vehicle selection
    const handleFleetSelection = (fleetId: string) => {
        if (fleetId === '') {
            setAssignForm({ ...assignForm, vehicleNumber: '', vehicle_models: '', assignedVehicleId: '' });
            return;
        }

        const selectedVehicle = fleetVehicles.find(v => v.id === fleetId);
        if (selectedVehicle) {
            // Build vehicle name from model/brand/category
            let vModel = '';
            if (selectedVehicle.vehicle_models) {
                vModel = selectedVehicle.vehicle_models.brands?.name
                    ? `${selectedVehicle.vehicle_models.brands.name} ${selectedVehicle.vehicle_models.name}`
                    : selectedVehicle.vehicle_models.name;
            } else if (selectedVehicle.brands && selectedVehicle.chauffeur_vehicle_categories) {
                vModel = `${selectedVehicle.brands.name} ${selectedVehicle.chauffeur_vehicle_categories.name}`;
            } else if (selectedVehicle.chauffeur_vehicle_categories) {
                vModel = selectedVehicle.chauffeur_vehicle_categories.name;
            }

            setAssignForm({
                ...assignForm,
                vehicleNumber: selectedVehicle.registrationNumber || '',
                vehicle_models: vModel,
                assignedVehicleId: fleetId,
            });
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    // Fetch fleet vehicles and staff drivers with booking dates for availability check
    useEffect(() => {
        if (booking?.pickupDate) {
            fetchFleetVehicles(booking.pickupDate, booking.returnDate);
            fetchStaffDrivers(booking.pickupDate, booking.returnDate);
        } else if (booking) {
            fetchFleetVehicles();
            fetchStaffDrivers();
        }
    }, [booking?.pickupDate, booking?.id]);

    const handleAssignSubmit = async () => {
        if (!assignForm.driverName || !assignForm.driverPhone || !assignForm.vehicleNumber) {
            alert('Please fill all required fields');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/vendor/bus-bookings/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignForm),
            });

            const data = await response.json();
            if (data.success) {
                fetchBooking();
                setShowAssignForm(false);
                alert('Driver and vehicle assigned successfully');
            } else {
                alert(data.error || 'Failed to assign');
            }
        } catch (err) {
            alert('Failed to perform action');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartTrip = async (otp: string) => {
        if (!otp) {
            alert('OTP is required');
            return;
        }
        setActionLoading(true);
        try {
            const response = await fetch(`/api/vendor/bus-bookings/${id}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp }),
            });
            const data = await response.json();
            if (data.success) {
                fetchBooking();
                alert('Trip started successfully');
            } else {
                alert(data.error || 'Failed to start trip');
            }
        } catch (err) {
            alert('Failed to start trip');
        } finally {
            setActionLoading(false);
        }
    };

    const getTripTypeName = (type: string) => BUS_TRIP_TYPES.find(t => t.id === type)?.name || type;

    if (isLoading) {
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-gray-200" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-32 bg-gray-200 rounded-lg" />
                            <div className="h-5 w-20 bg-gray-100 rounded-full" />
                            <div className="h-5 w-24 bg-gray-100 rounded-full" />
                        </div>
                        <div className="h-3 w-36 bg-gray-100 rounded" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-white flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl" />
                            <div className="space-y-2">
                                <div className="h-5 w-40 bg-gray-200 rounded-lg" />
                                <div className="h-3 w-28 bg-gray-100 rounded" />
                            </div>
                        </div>
                        <div className="space-y-1.5 text-right">
                            <div className="h-6 w-20 bg-gray-200 rounded-lg ml-auto" />
                            <div className="h-3 w-24 bg-gray-100 rounded ml-auto" />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="px-4 py-3 space-y-1.5">
                                <div className="h-2.5 w-12 bg-gray-100 rounded" />
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-2.5 w-16 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid lg:grid-cols-3 gap-4 animate-pulse">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="h-4 w-20 bg-gray-200 rounded-lg mb-3" />
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-full" />
                                <div className="space-y-1.5">
                                    <div className="h-4 w-28 bg-gray-200 rounded" />
                                    <div className="h-3 w-40 bg-gray-100 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="h-4 w-20 bg-gray-200 rounded-lg mb-3" />
                            <div className="space-y-2.5">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex justify-between">
                                        <div className="h-3 w-20 bg-gray-100 rounded" />
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
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
                <button onClick={() => router.push('/vendor/bus/bookings')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Back to Bookings
                </button>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
    const balanceDue = booking.totalAmount - booking.advancePaid;
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/vendor/bus/bookings" className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold text-gray-900">#{booking.bookingNumber}</h1>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${booking.paymentStatus === 'PAID' || booking.advancePaymentVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {booking.advancePaymentVerified ? 'Advance Paid' : booking.paymentStatus || 'Pending'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(booking.createdAt)}</p>
                    </div>
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

            {/* ── Vehicle + Price Hero ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 via-blue-50/30 to-white">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white rounded-xl border border-indigo-100 flex items-center justify-center text-2xl shadow-sm shrink-0">🚌</div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">{booking.vehicleName}</h2>
                            <p className="text-xs text-gray-400">{getTripTypeName(booking.tripType)}{booking.vehicleNumber && <> · <span className="font-mono">{booking.vehicleNumber}</span></>}</p>
                            {booking.driverName && (
                                <p className="text-xs text-emerald-600 font-medium mt-0.5">Driver: {booking.driverName}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-extrabold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{booking.tripDays} day{booking.tripDays !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {/* Quick stats strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                    {[
                        { label: 'Pickup', value: new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), sub: booking.pickupTime },
                        { label: 'Return', value: booking.returnDate ? new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—', sub: booking.returnTime || '' },
                        { label: 'Passengers', value: `${booking.passengers}`, sub: 'pax' },
                        { label: 'Route', value: booking.pickupCity, sub: booking.dropCity ? `→ ${booking.dropCity}` : 'One way' },
                    ].map((s, i) => (
                        <div key={i} className="px-4 py-3">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{s.value}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 items-start">
                {/* ══ Main Content ══ */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Customer */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Customer</h3>
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
                                    <User className="w-3 h-3" /> {booking.customerPhone}
                                </a>
                            )}
                            {booking.customerEmail && (
                                <a href={`mailto:${booking.customerEmail}`} className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all">
                                    <Mail className="w-3 h-3" /> Email
                                </a>
                            )}
                            {booking.customerPhone && (
                                <a href={`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-all">
                                    WhatsApp
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Pickup / Drop addresses */}
                    {(booking.pickupAddress || booking.dropAddress) && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Locations</h3>
                            <div className="space-y-3">
                                {booking.pickupAddress && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pickup</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.pickupCity}</p>
                                            <p className="text-xs text-gray-500">{booking.pickupAddress}</p>
                                        </div>
                                    </div>
                                )}
                                {booking.dropAddress && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drop</p>
                                            <p className="text-sm font-bold text-gray-900">{booking.dropCity}</p>
                                            <p className="text-xs text-gray-500">{booking.dropAddress}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Route Details */}
                    {booking.routeDetails && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Route Details</h3>
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{booking.routeDetails}</p>
                        </div>
                    )}

                    {/* Customer Notes */}
                    {booking.customerNotes && (
                        <div className="bg-amber-50/60 rounded-2xl border border-amber-100 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Customer Notes</h3>
                            <p className="text-xs text-gray-600 leading-relaxed">{booking.customerNotes}</p>
                        </div>
                    )}

                    {/* Driver Assignment Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                Driver Assignment
                            </h3>
                            {!booking.driverName && !showAssignForm && (
                                <button
                                    onClick={() => setShowAssignForm(true)}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Assign Driver
                                </button>
                            )}
                            {booking.driverName && !showAssignForm && ['VEHICLE_ASSIGNED', 'ADVANCE_PAID'].includes(booking.status) && (
                                <button
                                    onClick={() => setShowAssignForm(true)}
                                    className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    Change Driver
                                </button>
                            )}
                        </div>

                        {showAssignForm ? (
                            <div className="p-6 bg-indigo-50/30 space-y-6">
                                <div className="space-y-4">
                                    {/* Vehicle Selection - Show if no vehicle was assigned in quote */}
                                    {!booking.vehicleNumber && fleetVehicles.length > 0 && (
                                        <div className="space-y-3 pb-4 border-b border-indigo-200">
                                            <label className="block text-sm font-medium text-gray-700">
                                                <Bus className="w-4 h-4 inline mr-1 text-orange-500" />
                                                Select Vehicle from Fleet *
                                            </label>
                                            <select
                                                className="w-full px-4 py-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                                                value={assignForm.assignedVehicleId}
                                                onChange={(e) => handleFleetSelection(e.target.value)}
                                            >
                                                <option value="">-- Select a vehicle from your fleet --</option>
                                                {fleetVehicles.map((vehicle) => {
                                                    // Build display name
                                                    let displayName = '';
                                                    if (vehicle.vehicle_models) {
                                                        displayName = vehicle.vehicle_models.brands?.name
                                                            ? `${vehicle.vehicle_models.brands.name} ${vehicle.vehicle_models.name}`
                                                            : vehicle.vehicle_models.name;
                                                    } else if (vehicle.brands && vehicle.chauffeur_vehicle_categories) {
                                                        displayName = `${vehicle.brands.name} ${vehicle.chauffeur_vehicle_categories.name}`;
                                                    } else if (vehicle.chauffeur_vehicle_categories) {
                                                        displayName = vehicle.chauffeur_vehicle_categories.name;
                                                    }

                                                    // Add registration number if available
                                                    const regNum = vehicle.registrationNumber ? ` (${vehicle.registrationNumber})` : '';
                                                    const isBookedForDates = vehicle.isAvailableForDates === false;

                                                    return (
                                                        <option key={vehicle.id} value={vehicle.id} disabled={isBookedForDates}>
                                                            {displayName}{regNum}{isBookedForDates ? ' — Booked for these dates' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            {assignForm.vehicleNumber && (
                                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <p className="text-sm font-bold text-orange-800">{assignForm.vehicle_models}</p>
                                                    <p className="text-xs text-orange-600 font-mono">{assignForm.vehicleNumber}</p>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                No vehicle was selected when the quote was sent. Please select a vehicle now.
                                            </p>
                                        </div>
                                    )}

                                    {/* Show assigned vehicle from quote */}
                                    {booking.vehicleNumber && (
                                        <p className="text-sm text-gray-600 italic pb-4 border-b border-indigo-200">
                                            Vehicle: <strong>{booking.vehicleNumber}</strong> ({booking.vehicleName || booking.vehicleCategory})
                                        </p>
                                    )}

                                    {/* Driver Selection */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-gray-700">Select Driver from Staff *</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={staffDrivers.find(d => d.name === assignForm.driverName)?.id || ''}
                                            onChange={(e) => {
                                                const driver = staffDrivers.find(d => d.id === e.target.value);
                                                if (driver) {
                                                    setAssignForm({
                                                        ...assignForm,
                                                        driverName: driver.name,
                                                        driverPhone: driver.phone
                                                    });
                                                }
                                            }}
                                        >
                                            <option value="">-- Select Driver --</option>
                                            {staffDrivers.map(d => {
                                                const isAssignedForDates = d.isAvailableForDates === false;
                                                return (
                                                    <option key={d.id} value={d.id} disabled={isAssignedForDates}>
                                                        {d.name} ({d.phone}){isAssignedForDates ? ' — Assigned for these dates' : ''}
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {assignForm.driverName && (
                                            <div className="p-3 bg-white border rounded-lg space-y-1">
                                                <p className="text-sm font-bold">{assignForm.driverName}</p>
                                                <p className="text-xs text-gray-500">{assignForm.driverPhone}</p>
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
                                        disabled={actionLoading || !assignForm.driverName || (!booking.vehicleNumber && !assignForm.vehicleNumber)}
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
                                        <p className="text-xs text-gray-500 uppercase font-bold">Assigned Driver</p>
                                        <p className="font-bold text-gray-900 text-lg">{booking.driverName}</p>
                                        <p className="text-indigo-600 font-medium">{booking.driverPhone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 border-l pl-8">
                                    <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                        <Bus className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Vehicle Details</p>
                                        <p className="font-bold text-gray-900 text-lg">{booking.vehicleNumber || 'N/A'}</p>
                                        <p className="text-gray-600">{booking.vehicle_models || booking.vehicleName || 'Standard'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No driver assigned yet.</p>
                                <p className="text-sm">Assigned vehicle: <strong>{booking.vehicleNumber || booking.vehicleName}</strong></p>
                                <button
                                    onClick={() => setShowAssignForm(true)}
                                    className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                                >
                                    Assign Driver Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ Sidebar ══ */}
                <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
                    {/* Payment Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payment</h3>
                        <div className="space-y-2.5">
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Total Amount</span><span className="font-semibold text-gray-700">₹{booking.totalAmount.toLocaleString()}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Advance Paid</span><span className="font-semibold text-emerald-600">₹{booking.advancePaid.toLocaleString()}</span></div>
                            <div className="border-t border-gray-100 pt-2.5 mt-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-gray-900">Balance Due</span>
                                    <span className="text-xl font-extrabold text-orange-600">₹{balanceDue.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="pt-1 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.advancePaymentVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {booking.advancePaymentVerified ? '✓ Verified' : booking.paymentStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trip Progress */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Navigation className="w-4 h-4 text-purple-500" /> Trip Progress</h3>

                        {(() => {
                            const isDropped = booking.status === 'DROPPED';
                            const paymentDone = booking.advancePaymentVerified;
                            const driverDone = !!booking.driverName;
                            const tripStarted = ['IN_PROGRESS', 'COMPLETED'].includes(booking.status);
                            const tripCompleted = booking.status === 'COMPLETED';

                            // Determine which step was last completed before drop
                            let droppedAfterStep = -1;
                            if (isDropped) {
                                if (tripStarted) droppedAfterStep = 2;
                                else if (driverDone) droppedAfterStep = 1;
                                else if (paymentDone) droppedAfterStep = 0;
                            }

                            const steps = [
                                { label: 'Payment Verified', desc: 'Booking confirmed with vendor', done: paymentDone, icon: <CheckCircle className="w-5 h-5" />, time: null },
                                { label: 'Driver Assigned', desc: 'Vehicle & staff details shared', done: driverDone, icon: <Users className="w-5 h-5" />, time: null },
                                { label: 'Trip Started', desc: 'Driver started with OTP', done: tripStarted, icon: <Navigation className="w-5 h-5" />, time: booking.tripStartedAt },
                                { label: 'Completed', desc: 'Trip ended successfully', done: tripCompleted, icon: <CheckCircle className="w-5 h-5" />, time: booking.tripEndedAt },
                            ];

                            const timelineItems: any[] = [];
                            for (let i = 0; i < steps.length; i++) {
                                const step = steps[i];
                                const isAfterDrop = isDropped && i > droppedAfterStep;
                                timelineItems.push({
                                    ...step,
                                    grayed: isAfterDrop,
                                    bgClass: isAfterDrop ? 'bg-gray-200 text-gray-400' : (step.done ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'),
                                    textClass: isAfterDrop ? 'text-gray-400' : (step.done ? 'text-gray-900' : 'text-gray-400'),
                                });
                                if (isDropped && i === droppedAfterStep) {
                                    timelineItems.push({
                                        label: 'Booking Dropped',
                                        desc: (booking as any).dropReason ? `Reason: ${(booking as any).dropReason}` : 'Booking was dropped',
                                        done: false,
                                        icon: <XCircle className="w-5 h-5" />,
                                        time: (booking as any).droppedAt,
                                        isDroppedMarker: true,
                                        bgClass: 'bg-red-600 text-white',
                                        textClass: 'text-red-700',
                                    });
                                }
                            }

                            return (
                                <div className="space-y-8 relative">
                                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />
                                    {timelineItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${item.bgClass}`}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${item.textClass}`}>{item.label}</p>
                                                <p className={`text-xs ${item.isDroppedMarker ? 'text-red-500' : 'text-gray-500'}`}>{item.desc}</p>
                                                {item.time && (
                                                    <p className={`text-[10px] font-mono mt-1 ${item.isDroppedMarker ? 'text-red-500' : 'text-green-600'}`}>
                                                        {new Date(item.time).toLocaleString('en-IN')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Action banners */}
                        <div className="mt-5 space-y-2.5">
                            {booking.status === 'VEHICLE_ASSIGNED' && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Awaiting Trip Start</p>
                                    <p className="text-[11px] text-indigo-600 mt-0.5">Driver <strong>{booking.driverName}</strong> assigned. Driver will start trip from their dashboard.</p>
                                </div>
                            )}
                            {booking.status === 'IN_PROGRESS' && (
                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-purple-800 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Trip Live</p>
                                    <p className="text-[11px] text-purple-600 mt-0.5">Trip in progress. Driver will mark complete from their app.</p>
                                </div>
                            )}
                            {booking.status === 'ADVANCE_PAID' && !booking.driverName && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                    <p className="text-xs font-bold text-blue-800">Assignment Pending</p>
                                    <p className="text-[11px] text-blue-600 mt-0.5">Please assign a driver and vehicle to proceed.</p>
                                </div>
                            )}
                            {booking.status === 'COMPLETED' && (
                                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold text-emerald-800">Trip Completed!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Proof */}
                    {booking.advancePaymentProof && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-500" /> Payment Proof</h3>
                            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                                <img src={booking.advancePaymentProof} alt="Payment Proof" className="w-full h-full object-cover" />
                                <a href={booking.advancePaymentProof} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye className="text-white w-7 h-7" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
