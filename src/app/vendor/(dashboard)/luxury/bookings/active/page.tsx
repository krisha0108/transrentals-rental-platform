'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
}

const STATUS_CONFIG: Record<string, { label: string; color: string; nextAction: string }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', nextAction: 'Assign Chauffeur' },
  CHAUFFEUR_ASSIGNED: { label: 'Chauffeur Assigned', color: 'bg-indigo-100 text-indigo-700', nextAction: 'Start Trip' },
  EN_ROUTE_PICKUP: { label: 'En Route to Pickup', color: 'bg-blue-100 text-blue-700', nextAction: 'Arrive at Pickup' },
  ARRIVED_PICKUP: { label: 'Arrived at Pickup', color: 'bg-yellow-100 text-yellow-700', nextAction: 'Start Trip' },
  TRIP_STARTED: { label: 'Trip in Progress', color: 'bg-purple-100 text-purple-700', nextAction: 'Complete Trip' },
  EN_ROUTE_DROP: { label: 'En Route to Drop', color: 'bg-purple-100 text-purple-700', nextAction: 'Complete Trip' },
};

export default function VendorLuxuryActivePage() {
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  // Driver assignment form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicle_model, setVehicleModel] = useState('');

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading active trips...</p>
        </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Luxury Trips</h1>
            <p className="text-gray-600">Manage ongoing premium chauffeur bookings</p>
          </div>
        </div>
        <button
          onClick={fetchBookings}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-700">
            {bookings.filter((b) => b.status === 'CONFIRMED').length}
          </p>
          <p className="text-sm text-green-600">Awaiting Chauffeur</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-2xl font-bold text-indigo-700">
            {bookings.filter((b) => ['CHAUFFEUR_ASSIGNED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(b.status)).length}
          </p>
          <p className="text-sm text-indigo-600">Ready for Pickup</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-700">
            {bookings.filter((b) => ['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(b.status)).length}
          </p>
          <p className="text-sm text-purple-600">In Progress</p>
        </div>
      </div>

      {/* Bookings */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-amber-100">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-1">No active trips</h3>
            <p className="text-sm text-gray-500">Active luxury bookings will appear here</p>
          </div>
        ) : (
          bookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-sm text-amber-200">#{booking.bookingNumber}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  {/* Car & Price */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {booking.assignedVehicle || booking.specificVehicle || booking.vehiclePreference || booking.vehicleCategoryName || booking.chauffeur_vehicle_categories}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {booking.dropCity
                            ? `${booking.pickupCity} → ${booking.dropCity}`
                            : booking.pickupCity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {booking.totalAmount ? (
                        <p className="text-xl font-bold text-amber-600">
                          ₹{booking.totalAmount.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Price TBD</p>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid md:grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Address</p>
                        <p className="text-sm font-medium">{booking.pickupAddress || booking.pickupCity}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Time</p>
                        <p className="text-sm font-medium">
                          {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          at {booking.pickupTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Guest</p>
                        <p className="text-sm font-medium">{booking.customerName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Chauffeur Details */}
                  {booking.chauffeurName && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 mb-4 border border-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-amber-700 flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          Premium Chauffeur
                        </p>
                        {booking.startOtp && ['CHAUFFEUR_ASSIGNED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) && (
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-amber-600" />
                            <span className="font-mono font-bold text-lg text-amber-700">
                              OTP: {booking.startOtp}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.chauffeurName}
                        </span>
                        {booking.chauffeurPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {booking.chauffeurPhone}
                          </span>
                        )}
                        {booking.assignedVehicle && (
                          <span className="flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {booking.assignedVehicle}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Trip In Progress Info */}
                  {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                    <div className="bg-purple-50 rounded-lg p-3 mb-4 border border-purple-100">
                      <p className="text-sm text-purple-700 flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        Trip is in progress
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setShowAssignModal(booking.id)}
                        className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                      >
                        <User className="w-5 h-5" />
                        Assign Chauffeur
                      </button>
                    )}

                    {['CHAUFFEUR_ASSIGNED', 'EN_ROUTE_PICKUP', 'ARRIVED_PICKUP'].includes(booking.status) && (
                      <div className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                        <span>🚗</span>
                        <span>Trip will be started by your assigned chauffeur. You will see all status updates here.</span>
                      </div>
                    )}

                    {['TRIP_STARTED', 'EN_ROUTE_DROP'].includes(booking.status) && (
                      <button
                        onClick={() => handleCompleteTrip(booking.id)}
                        className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <Flag className="w-5 h-5" />
                        Complete Trip
                      </button>
                    )}

                    <Link
                      href={`/vendor/luxury/bookings/${booking.id}`}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </Link>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Assign Chauffeur Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Assign Premium Chauffeur
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chauffeur Name *
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter chauffeur name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chauffeur Phone *
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g., DL 01 AB 1234"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  value={vehicle_model}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="e.g., Mercedes E-Class 2024"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleAssignDriver(showAssignModal)}
                disabled={assigningId === showAssignModal}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-bold rounded-lg hover:from-amber-600 hover:to-yellow-600 transition disabled:opacity-50"
              >
                {assigningId === showAssignModal ? 'Assigning...' : 'Assign Chauffeur'}
              </button>
              <button
                onClick={() => setShowAssignModal(null)}
                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
