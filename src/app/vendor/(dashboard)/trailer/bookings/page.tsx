'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Container,
  CalendarCheck,
  MapPin,
  Calendar,
  Phone,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
  Weight,
} from 'lucide-react';
import { TRAILER_CONFIG } from '@/lib/quote-services';

interface TrailerBooking {
  id: string;
  bookingNumber: string;
  trailerType: string;
  cargoType: string;
  weight: number;
  fromCity: string;
  toCity: string;
  loadingDate: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  status: string;
  vehicleNumber?: string;
  driverName?: string;
  rating?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  LOADING: { label: 'Loading', color: 'bg-indigo-100 text-indigo-700', icon: Container },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const SAMPLE_BOOKINGS: TrailerBooking[] = [
  {
    id: '1',
    bookingNumber: 'TL-BK-2024-0001',
    trailerType: 'lowbed',
    cargoType: 'Excavator PC300',
    weight: 35000,
    fromCity: 'Chennai',
    toCity: 'Hyderabad',
    loadingDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    customerName: 'Metro Construction',
    customerPhone: '9876543210',
    totalAmount: 85000,
    advancePaid: 42500,
    balanceAmount: 42500,
    status: 'CONFIRMED',
    vehicleNumber: 'TN 01 AB 1234',
    driverName: 'Rajesh',
  },
  {
    id: '2',
    bookingNumber: 'TL-BK-2024-0002',
    trailerType: 'flatbed-40ft',
    cargoType: 'Steel Beams',
    weight: 28000,
    fromCity: 'Jamshedpur',
    toCity: 'Mumbai',
    loadingDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    customerName: 'Steel Corp India',
    customerPhone: '9876543211',
    totalAmount: 125000,
    advancePaid: 125000,
    balanceAmount: 0,
    status: 'DELIVERED',
    vehicleNumber: 'JH 01 XY 5678',
    driverName: 'Suresh',
    rating: 5,
  },
];

export default function VendorTrailerBookingsPage() {
  const [bookings, setBookings] = useState<TrailerBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    setTimeout(() => {
      setBookings(SAMPLE_BOOKINGS);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return ['PENDING_PAYMENT', 'CONFIRMED', 'LOADING', 'IN_TRANSIT'].includes(b.status);
    if (filter === 'completed') return b.status === 'DELIVERED';
    return true;
  });

  const getCategoryName = (id: string) => {
    return TRAILER_CONFIG.categories.find((c) => c.id === id)?.shortName || id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trailer Bookings</h1>
            <p className="text-gray-600">Manage your heavy transport jobs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => ['PENDING_PAYMENT', 'CONFIRMED', 'LOADING', 'IN_TRANSIT'].includes(b.status)).length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'DELIVERED').length}
          </p>
          <p className="text-sm text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <p className="text-2xl font-bold text-slate-600">
            ₹{bookings.reduce((sum, b) => sum + b.balanceAmount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Pending Balance</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-purple-100">
          <p className="text-2xl font-bold text-purple-600">
            ₹{bookings.reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Value</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Delivered' },
          { value: 'all', label: 'All' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.value ? 'bg-slate-100 text-slate-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border">
            <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900">No bookings found</h3>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">#{booking.bookingNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />{statusConfig.label}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Container className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{getCategoryName(booking.trailerType)}</h3>
                        <p className="text-sm text-gray-500">{booking.cargoType}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {booking.fromCity}<ArrowRight className="w-3 h-3 mx-1" />{booking.toCity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
                      {booking.balanceAmount > 0 && (
                        <p className="text-sm text-slate-600">Balance: ₹{booking.balanceAmount.toLocaleString()}</p>
                      )}
                      {booking.rating && (
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{booking.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {new Date(booking.loadingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Weight className="w-4 h-4 text-slate-500" />
                      {(booking.weight / 1000).toFixed(0)} tons
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{booking.customerPhone}
                      </p>
                    </div>
                    {booking.vehicleNumber && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Vehicle</span>
                        <p className="font-medium text-gray-900">{booking.vehicleNumber}</p>
                        {booking.driverName && <p className="text-sm text-gray-600">Driver: {booking.driverName}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/trailer/bookings/${booking.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
