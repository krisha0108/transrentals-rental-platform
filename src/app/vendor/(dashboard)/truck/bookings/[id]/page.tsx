'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
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
  Package,
  Weight,
  Key,
} from 'lucide-react';

interface TruckBooking {
  id: string;
  bookingNumber: string;
  serviceType: string;
  chauffeur_vehicle_categories: string;
  vehicleName?: string;
  goodsType: string;
  weight?: number;
  weightUnit?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupCity: string;
  pickupAddress?: string;
  dropCity: string;
  dropAddress?: string;
  pickupDate: string;
  pickupTime: string;
  totalAmount: number;
  advanceAmount: number;
  advancePaid: number;
  paymentStatus: string;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  vehicle_model?: string;
  loadingOtp?: string;
  deliveryOtp?: string;
  loadingStartedAt?: string;
  loadingCompletedAt?: string;
  deliveredAt?: string;
  advancePaymentRef?: string;
  advancePaymentProof?: string;
  advancePaymentVerified?: boolean;
  customerNotes?: string;
  createdAt: string;
  quoteRequest?: {
    id: string;
    requestNumber: string;
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
  VEHICLE_ASSIGNED: { label: 'Driver Assigned', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  LOADING: { label: 'Loading', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  IN_TRANSIT: { label: 'In Transit', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  UNLOADING: { label: 'Unloading', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const TRUCK_TYPES: Record<string, string> = {
  'tata-ace': 'Tata Ace / Mini Truck',
  'pickup': 'Pickup Truck',
  'canter-14ft': '14 Feet Truck (Canter)',
  'canter-17ft': '17 Feet Truck (Canter)',
  'canter-19ft': '19 Feet Truck',
  'canter-22ft': '22 Feet Truck',
  'container': '32 Feet Container',
  'trailer': 'Trailer / Multi-Axle',
  'refrigerated': 'Refrigerated Truck',
  'tanker': 'Tanker Truck',
  'tipper': 'Tipper Truck',
};

export default function VendorTruckBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [booking, setBooking] = useState<TruckBooking | null>(null);
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
  });

  const [staffDrivers, setStaffDrivers] = useState<StaffDriver[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<FleetVehicle[]>([]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/vendor/truck-bookings/${id}`);
      const data = await response.json();

      if (data.success) {
        setBooking(data.booking);
        setAssignForm({
          driverName: data.booking.driverName || '',
          driverPhone: data.booking.driverPhone || '',
          vehicleNumber: data.booking.vehicleNumber || '',
          vehicle_models: data.booking.vehicle_models || '',
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
        const truckFleet = data.fleet.filter((v: FleetVehicle) => {
          const svc = (v as any).services || v.service;
          const slug = svc?.slug?.toLowerCase() || '';
          const name = svc?.name?.toLowerCase() || '';
          return slug.includes('truck') || name.includes('truck');
        });
        setFleetVehicles(truckFleet);
      }
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    }
  };

  const handleFleetSelection = (fleetId: string) => {
    if (!fleetId) {
      setAssignForm({ ...assignForm, vehicleNumber: '', vehicle_models: '' });
      return;
    }

    const vehicle = fleetVehicles.find(v => v.id === fleetId);
    if (vehicle) {
      let vModel = '';
      if (vehicle.vehicle_models) {
        vModel = vehicle.vehicle_models.brand?.name
          ? `${vehicle.vehicle_models.brand.name} ${vehicle.vehicle_models.name}`
          : vehicle.vehicle_models.name;
      } else if (vehicle.brand && vehicle.vehicle_category) {
        vModel = `${vehicle.brand.name} ${vehicle.vehicle_category.name}`;
      } else if (vehicle.vehicle_category) {
        vModel = vehicle.vehicle_category.name;
      }

      setAssignForm({
        ...assignForm,
        vehicleNumber: vehicle.registrationNumber || '',
        vehicle_models: vModel,
      });
    }
  };

  useEffect(() => {
    fetchBooking();
    fetchStaffDrivers();
    fetchFleetVehicles();
  }, [id]);

  const handleAssignSubmit = async () => {
    if (!assignForm.driverName || !assignForm.driverPhone || !assignForm.vehicleNumber) {
      alert('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vendor/truck-bookings/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_driver', ...assignForm }),
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

  const getTruckTypeName = (id: string) => TRUCK_TYPES[id] || id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
        <p className="text-gray-600 mb-6">{error || 'The booking details could not be loaded.'}</p>
        <Link href="/vendor/truck/bookings" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-2">
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
          <Link href="/vendor/truck/bookings" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getTruckTypeName(booking.vehicle_category)}</h2>
                  <p className="text-gray-600">{booking.serviceType?.replace('-', ' ').toUpperCase() || 'Transport'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup</p>
                    <p className="font-medium">{booking.pickupCity}</p>
                    {booking.pickupAddress && <p className="text-sm text-gray-600">{booking.pickupAddress}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Drop</p>
                    <p className="font-medium">{booking.dropCity}</p>
                    {booking.dropAddress && <p className="text-sm text-gray-600">{booking.dropAddress}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup Date</p>
                    <p className="font-medium">{new Date(booking.pickupDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    <p className="text-sm text-gray-600">at {booking.pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Goods Type</p>
                    <p className="font-medium">{booking.goodsType}</p>
                    {booking.weight && (
                      <p className="text-sm text-gray-600">{booking.weight} {booking.weightUnit || 'kg'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
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
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount</span>
                  <span className="font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Advance (Paid)</span>
                  <span className="font-bold text-green-600">₹{(booking.advancePaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-900 font-semibold">Remaining Balance</span>
                  <span className="font-bold text-blue-600 text-lg">₹{(booking.totalAmount - (booking.advancePaid || 0)).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
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
              {!booking.driverName && !showAssignForm && ['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
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
                  {/* Vehicle Selection */}
                  {fleetVehicles.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-indigo-200">
                      <label className="block text-sm font-medium text-gray-700">
                        <Truck className="w-4 h-4 inline mr-1 text-blue-500" />
                        Select Vehicle from Fleet *
                      </label>
                      <select
                        className="w-full px-4 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                      {assignForm.vehicleNumber && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-bold text-blue-800">{assignForm.vehicle_models}</p>
                          <p className="text-xs text-blue-600 font-mono">{assignForm.vehicleNumber}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Vehicle Entry (if no fleet) */}
                  {fleetVehicles.length === 0 && (
                    <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-indigo-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
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
                          placeholder="Tata 407"
                        />
                      </div>
                    </div>
                  )}

                  {/* Driver Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select Driver from Staff *</label>
                    {staffDrivers.length > 0 ? (
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
                        <option value="">-- Select Driver --</option>
                        {staffDrivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                          <input
                            type="text"
                            value={assignForm.driverName}
                            onChange={(e) => setAssignForm({ ...assignForm, driverName: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter driver name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Driver Phone *</label>
                          <input
                            type="tel"
                            value={assignForm.driverPhone}
                            onChange={(e) => setAssignForm({ ...assignForm, driverPhone: e.target.value })}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="9737965551"
                          />
                        </div>
                      </div>
                    )}

                    {assignForm.driverName && staffDrivers.length > 0 && (
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
                    disabled={actionLoading || !assignForm.driverName || !assignForm.vehicleNumber}
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
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Truck className="w-8 h-8" />
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
                {['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status) && (
                  <button
                    onClick={() => setShowAssignForm(true)}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                  >
                    Assign Driver Now
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.advancePaymentVerified || ['ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Payment Verified</p>
                  <p className="text-xs text-gray-500">Booking confirmed</p>
                </div>
              </div>

              {/* Step 2: Driver Assigned */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.driverName ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.driverName ? 'text-gray-900' : 'text-gray-400'}`}>Driver Assigned</p>
                  <p className="text-xs text-gray-500">Vehicle & driver ready</p>
                </div>
              </div>

              {/* Step 3: Loading */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['LOADING', 'IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>Loading</p>
                  <p className="text-xs text-gray-500">Goods being loaded</p>
                  {booking.loadingStartedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.loadingStartedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 4: In Transit */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${['IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${['IN_TRANSIT', 'UNLOADING', 'COMPLETED'].includes(booking.status) ? 'text-gray-900' : 'text-gray-400'}`}>In Transit</p>
                  <p className="text-xs text-gray-500">Goods in transit</p>
                  {booking.loadingCompletedAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.loadingCompletedAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>

              {/* Step 5: Completed */}
              <div className="flex gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${booking.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className={`font-bold ${booking.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}`}>Delivered</p>
                  <p className="text-xs text-gray-500">Goods delivered</p>
                  {booking.deliveredAt && (
                    <p className="text-[10px] text-green-600 font-mono mt-1">{new Date(booking.deliveredAt).toLocaleString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* OTP Display */}
            {(booking.loadingOtp || booking.deliveryOtp) && (
              <div className="mt-8 pt-6 border-t space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  OTP Codes
                </h4>
                {booking.loadingOtp && booking.status === 'VEHICLE_ASSIGNED' && (
                  <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                    <p className="text-xs text-cyan-700 font-medium">Loading OTP</p>
                    <p className="text-2xl font-mono font-bold text-cyan-800">{booking.loadingOtp}</p>
                  </div>
                )}
                {booking.deliveryOtp && booking.status === 'IN_TRANSIT' && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium">Delivery OTP</p>
                    <p className="text-2xl font-mono font-bold text-green-800">{booking.deliveryOtp}</p>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            <div className="mt-6 pt-6 border-t">
              {booking.status === 'VEHICLE_ASSIGNED' && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                  <p className="text-sm font-bold text-indigo-800 mb-1">Awaiting Loading</p>
                  <p className="text-xs text-indigo-700">
                    Driver {booking.driverName} will start loading with OTP verification.
                  </p>
                </div>
              )}
              {['LOADING', 'IN_TRANSIT', 'UNLOADING'].includes(booking.status) && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Trip in Progress
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-bounce p-3 bg-purple-200 rounded-full text-purple-700">
                      <Truck className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}
              {booking.status === 'ADVANCE_PAID' && !booking.driverName && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm font-bold text-blue-800 mb-1">Assignment Pending</p>
                  <p className="text-xs text-blue-700">Please assign a driver and vehicle to proceed.</p>
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
