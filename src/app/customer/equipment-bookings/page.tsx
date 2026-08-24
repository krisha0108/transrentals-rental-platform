'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerHeader from '@/components/customer/CustomerHeader';
import { quoteDisplay } from '@/lib/quote-font';
import {
  Wrench,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  AlertCircle,
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface EquipmentBooking {
  id: string;
  bookingNumber: string;
  equipmentType: string;
  equipmentCategory: string;
  deliveryLocation: string;
  startDate: string;
  totalAmount: number;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  PAYMENT_SUBMITTED: { label: 'Payment Under Review', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  ADVANCE_PAID: { label: 'Advance Paid', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  EQUIPMENT_DEPLOYED: { label: 'Equipment Deployed', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  IN_USE: { label: 'In Use', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

function EquipmentBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingParam = searchParams.get('booking');

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<EquipmentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const customerData = localStorage.getItem('customer');
    if (!customerData) {
      router.push('/customer/login');
      return;
    }

    try {
      const parsed = JSON.parse(customerData);
      setCustomer(parsed);
    } catch {
      router.push('/customer/login');
    }
  }, [router]);

  useEffect(() => {
    if (!customer) return;

    const fetchData = async () => {
      try {
        const identifier = customer.phone || customer.email;

        // If booking number is provided, find and redirect to that booking
        if (bookingParam) {
          const response = await fetch(
            `/api/equipment-bookings?phone=${encodeURIComponent(identifier)}&bookingNumber=${encodeURIComponent(bookingParam)}`
          );
          const data = await response.json();

          if (data.success && data.booking) {
            // Redirect to the booking detail page
            router.replace(`/customer/equipment-bookings/${data.booking.id}`);
            return;
          } else if (data.success && data.bookings && data.bookings.length > 0) {
            // Find the booking by number
            const booking = data.bookings.find((b: EquipmentBooking) => b.bookingNumber === bookingParam);
            if (booking) {
              router.replace(`/customer/equipment-bookings/${booking.id}`);
              return;
            }
          }

          // Booking not found, show error
          setError(`Booking ${bookingParam} not found`);
          setIsLoading(false);
          return;
        }

        // Fetch all bookings
        const response = await fetch(
          `/api/equipment-bookings?phone=${encodeURIComponent(identifier)}`
        );
        const data = await response.json();

        if (data.success) {
          setBookings(data.bookings || []);
        } else {
          setError(data.error || 'Failed to load bookings');
        }
      } catch (err) {
        setError('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customer, bookingParam, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading || !customer) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">
            {bookingParam ? 'Finding your booking...' : 'Loading bookings...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 p-4`}>
        <div className="max-w-2xl mx-auto">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 pt-16`}>
      <CustomerHeader showBackButton />
      {/* Header */}
      <div className="bg-[linear-gradient(118deg,#01301B_0%,#056B3E_46%,#078F53_100%)] text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/customer/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="quote-serif text-[30px] font-medium">Equipment Bookings</h1>
              <p className="text-white/80">View all your equipment rental bookings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="quote-serif text-[26px] font-medium text-gray-900 mb-2">No Bookings Yet</h2>
            <p className="text-gray-600 mb-6">You haven't made any equipment rental bookings yet.</p>
            <Link
              href="/equipment-rental"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition"
            >
              Browse Equipment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT;
              return (
                <Link
                  key={booking.id}
                  href={`/customer/equipment-bookings/${booking.id}`}
                  className="block bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.equipmentType}</p>
                          <p className="text-sm text-gray-500">#{booking.bookingNumber}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.deliveryLocation}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.startDate)}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-amber-600">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className={`${quoteDisplay.variable} min-h-screen bg-gray-50 flex items-center justify-center`}>
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function CustomerEquipmentBookingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EquipmentBookingsContent />
    </Suspense>
  );
}
