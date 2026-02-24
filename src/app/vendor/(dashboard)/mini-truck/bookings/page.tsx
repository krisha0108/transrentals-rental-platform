'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  CalendarCheck,
  MapPin,
  Calendar,

  Eye,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { MINI_TRUCK_CONFIG } from '@/lib/quote-services';

interface MiniTruckBooking {
  id: string;
  bookingNumber: string;
  vehicleType: string;
  goodsType: string;
  fromCity: string;
  toCity: string;
  pickupDate: string;
  pickupTime: string;
  customerName: string;

  totalAmount: number;
  status: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  rating?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DRIVER_ASSIGNED: { label: 'Driver Assigned', color: 'bg-indigo-100 text-indigo-700', icon: Truck },
  PICKED_UP: { label: 'Picked Up', color: 'bg-purple-100 text-purple-700', icon: Navigation },
  DELIVERED: { label: 'Delivered', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const SAMPLE_BOOKINGS: MiniTruckBooking[] = [
  {
    id: '1',
    bookingNumber: 'MT-BK-2024-0001',
    vehicleType: 'tata-ace',
    goodsType: 'Furniture',
    fromCity: 'Delhi',
    toCity: 'Noida',
    pickupDate: new Date(Date.now() + 1 * 86400000).toISOString(),
    pickupTime: '10:00',
    customerName: 'Rahul Sharma',

    totalAmount: 1500,
    status: 'DRIVER_ASSIGNED',
    driverName: 'Raju',
    driverPhone: '9876543299',
    vehicleNumber: 'DL 01 AB 1234',
  },
  {
    id: '2',
    bookingNumber: 'MT-BK-2024-0002',
    vehicleType: 'pickup-14ft',
    goodsType: 'Cartons',
    fromCity: 'Mumbai',
    toCity: 'Thane',
    pickupDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    pickupTime: '08:00',
    customerName: 'QuickMart Store',

    totalAmount: 3500,
    status: 'DELIVERED',
    driverName: 'Suresh',
    vehicleNumber: 'MH 01 XY 5678',
    rating: 5,
  },
];

export default function VendorMiniTruckBookingsPage() {
  const [bookings, setBookings] = useState<MiniTruckBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    setTimeout(() => {
      setBookings(SAMPLE_BOOKINGS);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'active') return ['CONFIRMED', 'DRIVER_ASSIGNED', 'PICKED_UP'].includes(b.status);
    if (filter === 'completed') return b.status === 'DELIVERED';
    return true;
  });

  const getCategoryName = (id: string) => {
    return MINI_TRUCK_CONFIG.categories.find((c) => c.id === id)?.shortName || id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mini Truck Bookings</h1>
            <p className="text-gray-600">Manage your trips</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">
            {bookings.filter((b) => ['CONFIRMED', 'DRIVER_ASSIGNED', 'PICKED_UP'].includes(b.status)).length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'DELIVERED').length}
          </p>
          <p className="text-sm text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-orange-100">
          <p className="text-2xl font-bold text-orange-600">
            ₹{bookings.filter(b => b.status !== 'CANCELLED').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-sm text-gray-500">Total Trips</p>
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.value ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
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
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Truck className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{getCategoryName(booking.vehicleType)}</h3>
                        <p className="text-sm text-gray-500">{booking.goodsType}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          {booking.fromCity}<ArrowRight className="w-3 h-3 mx-1" />{booking.toCity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{booking.totalAmount.toLocaleString()}</p>
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
                      <Calendar className="w-4 h-4 text-orange-500" />
                      {new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      @ {booking.pickupTime}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mb-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase">Customer</span>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                    </div>
                    {booking.driverName && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase">Driver</span>
                        <p className="font-medium text-gray-900">{booking.driverName}</p>
                        <p className="text-sm text-gray-600">{booking.vehicleNumber}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Link
                      href={`/vendor/mini-truck/bookings/${booking.id}`}
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
