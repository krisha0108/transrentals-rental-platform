// @ts-nocheck
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  MapPin, Calendar, Clock, Phone, Car, User, Shield,
  CheckCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight, Mail, Headphones,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Waiting for Driver', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  DRIVER_ARRIVED: { label: 'Driver Arrived', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  STARTED: { label: 'Trip in Progress', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  COMPLETED: { label: 'Trip Completed', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
  CANCELLED: { label: 'Trip Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  VENDOR_CANCELLED: { label: 'Cancelled by Vendor', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  ONE_WAY: 'One Way', ROUND_TRIP: 'Round Trip', HOURLY: 'Local / Hourly',
};

const IMAGE_LABELS: Record<string, string> = {
  front: 'Front', back: 'Back', leftSide: 'Left Side', rightSide: 'Right Side',
  inside: 'Interior', interior: 'Interior', left: 'Left', right: 'Right',
};

function parseVehicleImages(images: any): { url: string; label: string }[] {
  if (!images) return [];

  // If it's a JSON string, parse it
  let parsed = images;
  if (typeof images === 'string') {
    try { parsed = JSON.parse(images); } catch { return []; }
  }

  // If it's an object with keys like front, back, etc.
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return Object.entries(parsed)
      .filter(([, url]) => url && typeof url === 'string')
      .map(([key, url]) => ({ url: url as string, label: IMAGE_LABELS[key] || key }));
  }

  // If it's an array of URLs
  if (Array.isArray(parsed)) {
    return parsed.filter(Boolean).map((url, i) => ({ url, label: `Photo ${i + 1}` }));
  }

  return [];
}

export default function TripPage() {
  const params = useParams();
  const tripCode = params.tripCode as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, 10000);
    return () => clearInterval(interval);
  }, [tripCode]);

  async function fetchTrip() {
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}`);
      const data = await res.json();
      if (data.status === 'success') { setTrip(data.trip); setError(''); }
      else { setError(data.error || 'Trip not found'); }
    } catch { setError('Failed to load trip'); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length < 4) return;
    setVerifying(true);
    setMessage('');
    try {
      const res = await fetch(`/api/b2b/trips/${tripCode}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (data.status === 'success') { setMessage('Trip started successfully!'); fetchTrip(); }
      else { setMessage(data.error || 'Invalid OTP'); }
    } catch { setMessage('Failed to verify OTP'); }
    finally { setVerifying(false); }
  }

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr === 0 ? 12 : hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Trip Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const v = trip.vehicle;
  const d = trip.driver;
  const vehicleImages = parseVehicleImages(v?.images);
  const brandName = v?.vehicle_models?.brands?.name || v?.brands?.name || '';
  const modelName = v?.vehicle_models?.name || '';
  const displayVehicleName = v?.vehicleName || `${brandName} ${modelName}`.trim() || trip.vehicleName || 'Vehicle';
  const sc = statusConfig[trip.status] || statusConfig.PENDING;

  const scrollToImage = (index: number) => {
    setCurrentImageIndex(index);
    if (scrollRef.current) {
      const children = scrollRef.current.children;
      if (children[index]) {
        (children[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Trip Code & Status */}
        <div className="text-center mb-5">
          <p className="text-xs text-gray-400 font-medium tracking-wider uppercase mb-1">{trip.booking?.companyName}</p>
          <h1 className="text-lg font-bold text-gray-800 font-mono">{tripCode}</h1>
          <div className={`inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${sc.bg} ${sc.color}`}>
            {trip.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> :
             trip.status === 'STARTED' ? <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> :
             <Clock className="w-4 h-4" />}
            {sc.label}
          </div>
        </div>

        {/* OTP Display - Customer sees OTP to share with driver (shown prominently at top) */}
        {trip.showOtp && trip.otp && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-teal-200 p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-gray-800">Your Trip OTP</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Share this OTP with the driver to start your trip</p>
            <div className="bg-teal-50 rounded-xl p-5 text-center">
              <p className="text-4xl font-bold tracking-[0.5em] text-teal-800">{trip.otp}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">The driver will verify this OTP to begin the trip</p>
          </div>
        )}

        {/* Vehicle Card with Image Gallery */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          {/* Vehicle Images */}
          {vehicleImages.length > 0 ? (
            <div className="relative">
              {/* Main Image */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 relative">
                <img
                  src={vehicleImages[currentImageIndex]?.url}
                  alt={vehicleImages[currentImageIndex]?.label || displayVehicleName}
                  className="w-full h-[220px] object-cover"
                />
                {/* Image label */}
                <span className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {vehicleImages[currentImageIndex]?.label}
                </span>
                {/* Image counter */}
                <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {currentImageIndex + 1} / {vehicleImages.length}
                </span>

                {/* Nav arrows */}
                {vehicleImages.length > 1 && (
                  <>
                    <button
                      onClick={() => scrollToImage(currentImageIndex > 0 ? currentImageIndex - 1 : vehicleImages.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => scrollToImage(currentImageIndex < vehicleImages.length - 1 ? currentImageIndex + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {vehicleImages.length > 1 && (
                <div className="flex gap-1.5 px-3 py-2 bg-gray-50 overflow-x-auto" ref={scrollRef}>
                  {vehicleImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition ${
                        i === currentImageIndex ? 'border-teal-500 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-8 flex items-center justify-center min-h-[160px]">
              <Car className="w-20 h-20 text-teal-200" />
            </div>
          )}

          {/* Vehicle Details */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{displayVehicleName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {(trip.vehicleNumber || v?.registrationNumber) && (
                    <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
                      {trip.vehicleNumber || v.registrationNumber}
                    </span>
                  )}
                  {v?.color && <span className="text-xs text-gray-500">{v.color}</span>}
                  {v?.yearOfManufacture && <span className="text-xs text-gray-500">{v.yearOfManufacture}</span>}
                </div>
              </div>
              {brandName && (
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg font-medium">{brandName}</span>
              )}
            </div>

            {/* Vehicle Specs */}
            {v && (v.seatingCapacity || v.fuelType || v.transmission) && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                {v.seatingCapacity && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <User className="w-3.5 h-3.5" /> {v.seatingCapacity} Seats
                  </div>
                )}
                {v.fuelType && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" /> {v.fuelType}
                  </div>
                )}
                {v.transmission && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> {v.transmission}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Driver Card */}
        {(trip.driverName || d) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Driver</h3>
            <div className="flex items-center gap-4">
              {d?.profilePhoto ? (
                <img src={d.profilePhoto} alt={d.name || trip.driverName} className="w-14 h-14 rounded-full object-cover border-2 border-teal-100" />
              ) : (
                <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center border-2 border-teal-100">
                  <User className="w-7 h-7 text-teal-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-base">{d?.name || trip.driverName}</p>
                {(trip.driverPhone || d?.phone) && (
                  <a href={`tel:${trip.driverPhone || d.phone}`}
                    className="inline-flex items-center gap-1.5 mt-1 text-sm text-teal-600 font-medium">
                    <Phone className="w-3.5 h-3.5" /> {trip.driverPhone || d.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trip Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Trip Details</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="text-sm font-medium text-gray-800">{trip.pickupLocation}</p>
              </div>
            </div>

            {trip.dropLocation && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Drop</p>
                  <p className="text-sm font-medium text-gray-800">{trip.dropLocation}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-sm font-medium text-gray-800">{formatDate(trip.scheduledDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Time</p>
                  <p className="text-sm font-medium text-gray-800">{formatTime(trip.scheduledTime)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg font-medium capitalize">
                {trip.booking?.serviceType} Rental
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                {TRIP_TYPE_LABELS[trip.booking?.tripType] || trip.booking?.tripType}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {(trip.driverArrivedAt || trip.startedAt || trip.completedAt) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Timeline</h3>
            <div className="space-y-3">
              {[
                { label: 'Driver Arrived', time: trip.driverArrivedAt, color: 'bg-blue-500' },
                { label: 'Trip Started', time: trip.startedAt, color: 'bg-green-500' },
                { label: 'Trip Completed', time: trip.completedAt, color: 'bg-gray-500' },
              ].filter(e => e.time).map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${entry.color}`} />
                  <span className="text-sm text-gray-700 flex-1">{entry.label}</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {new Date(entry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed State */}
        {trip.status === 'COMPLETED' && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 text-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-green-800">Trip Completed</h3>
            <p className="text-sm text-green-600 mt-1">Thank you for travelling with TransRentals</p>
          </div>
        )}

        {/* Helpdesk */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Headphones className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs text-gray-400 font-medium uppercase tracking-wider">Need Help?</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="tel:9737965551" className="flex items-center gap-2.5 flex-1 bg-teal-50 hover:bg-teal-100 transition rounded-xl px-4 py-3">
              <Phone className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-800">9737965551</span>
            </a>
            <a href="mailto:book@transrentals.in" className="flex items-center gap-2.5 flex-1 bg-teal-50 hover:bg-teal-100 transition rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-800">book@transrentals.in</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 py-4">Powered by TransRentals</p>
      </div>
    </div>
  );
}
