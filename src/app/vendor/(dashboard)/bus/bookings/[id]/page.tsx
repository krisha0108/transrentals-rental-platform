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
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
                <p className="text-gray-600 mb-6">{error || 'The booking details could not be loaded.'}</p>
                <Link href="/vendor/bus/bookings" className="text-orange-600 font-medium hover:underline inline-flex items-center gap-2">
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
                    <Link
                        href="/vendor/bus/bookings"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
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
                        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                    <Bus className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{booking.vehicleName}</h2>
                                    <p className="text-gray-600">{booking.vehicleName || booking.vehicleCategory} • {getTripTypeName(booking.tripType)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
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
                                    <Calendar className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Travel Date</p>
                                        <p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        <p className="text-sm text-gray-600">at {booking.pickupTime}</p>
                                    </div>
                                </div>
                                {booking.returnDate && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Return Date</p>
                                            <p className="font-medium">{new Date(booking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                                            {booking.returnTime && <p className="text-sm text-gray-600">at {booking.returnTime}</p>}
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <Users className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Passengers</p>
                                        <p className="font-medium">{booking.passengers} Adults</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {booking.routeDetails && (
                            <div className="px-6 pb-6 pt-2 border-t mt-2">
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Route Details</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.routeDetails}</p>
                            </div>
                        )}
                    </div>

                    {/* Customer & Payment Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-600" />
                                Customer Info
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-500">Name</p>
                                    <p className="font-medium">{booking.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium">{booking.customerEmail}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-orange-600" />
                                Payment Summary
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Amount</span>
                                    <span className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Advance (Paid)</span>
                                    <span className="font-bold text-green-600">₹{booking.advancePaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t">
                                    <span className="text-gray-900 font-semibold">Remaining Balance</span>
                                    <span className="font-bold text-orange-600 text-lg">₹{(booking.totalAmount - booking.advancePaid).toLocaleString()}</span>
                                </div>
                                <div className="mt-2 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
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

                {/* Sidebar / Status Flow */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-bold text-gray-900 mb-6 border-b pb-4">Trip Progress</h3>

                        <div className="space-y-8 relative">
                            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100 -z-10" />

                            {/* Step 1: Confirmed */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.advancePaymentVerified ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-bold ${booking.advancePaymentVerified ? 'text-gray-900' : 'text-gray-400'}`}>Payment Verified</p>
                                    <p className="text-xs text-gray-500">Booking confirmed with vendor</p>
                                </div>
                            </div>

                            {/* Step 2: Driver Assigned */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.driverName ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-bold ${booking.driverName ? 'text-gray-900' : 'text-gray-400'}`}>Driver Assigned</p>
                                    <p className="text-xs text-gray-500">Vehicle & staff details shared</p>
                                </div>
                            </div>

                            {/* Step 3: Trip Started */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <Navigation className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-bold ${['IN_PROGRESS', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Trip Started</p>
                                    <p className="text-xs text-gray-500">Driver started with OTP</p>
                                    {booking.tripStartedAt && (
                                        <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.tripStartedAt).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 4: Trip Completed */}
                            <div className="flex gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className={`font-bold ${booking.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>Completed</p>
                                    <p className="text-xs text-gray-500">Trip ended successfully</p>
                                    {booking.tripEndedAt && (
                                        <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.tripEndedAt).toLocaleString('en-IN')}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vendor Action Area - Removed OTP display as requested */}
                        <div className="mt-8 pt-8 border-t">
                            {booking.status === 'VEHICLE_ASSIGNED' && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                    <p className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                                        <Navigation className="w-4 h-4" />
                                        Awaiting Trip Start
                                    </p>
                                    <p className="text-sm text-indigo-700">
                                        Driver <strong>{booking.driverName}</strong> has been assigned.
                                        The driver will initiate the trip start from their dashboard.
                                    </p>
                                </div>
                            )}

                            {booking.status === 'IN_PROGRESS' && (
                                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                    <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                                        <Navigation className="w-4 h-4" />
                                        Trip Live
                                    </p>
                                    <p className="text-xs text-purple-700 mb-4 font-medium"> The trip is currently in progress. The driver will complete the trip from their app.</p>
                                    <div className="flex justify-center">
                                        <div className="animate-bounce p-3 bg-purple-200 rounded-full text-purple-700">
                                            <Bus className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {booking.status === 'ADVANCE_PAID' && !booking.driverName && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <p className="text-sm font-bold text-blue-800 mb-2">Notice</p>
                                    <p className="text-xs text-blue-700">Assignment is pending. Please assign a driver and vehicle to proceed with the trip.</p>
                                </div>
                            )}
                        </div>

                        {/* Payment Proof Preview if available */}
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
        </div>
    );
}
