'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Phone,
  Mail,
  Car,
  Bike,
  Bus,
  CarFront,
  MapPin,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Truck,
  Package,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PendingPayment {
  id: string;
  bookingNumber: string;
  bookingType: 'bike' | 'chauffeur' | 'bus' | 'car' | 'truck' | 'equipment' | 'packers' | 'luxury';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceType: string;
  vehicleName: string;
  location: string;
  pickupDate: string;
  grandTotal: number;
  advanceAmount: number;
  advancePaymentRef: string;
  advancePaymentProof: string | null;
  advancePaymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bike' | 'chauffeur' | 'bus' | 'car' | 'truck' | 'equipment' | 'packers' | 'luxury'>('all');
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/pending?type=${filter}`);
      const data = await response.json();
      if (data.success) {
        setPayments(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (action: 'verify' | 'reject') => {
    if (!selectedPayment) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedPayment.id,
          bookingType: selectedPayment.bookingType, // Pass booking type
          action,
          notes: verifyNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSelectedPayment(null);
        setVerifyNotes('');
        fetchPayments();
        alert(data.message || 'Payment processed successfully');
      } else {
        alert(data.error || 'Failed to process');
      }
    } catch (err) {
      console.error('Failed to verify:', err);
      alert('Failed to process payment');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBookingTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      bike: { label: 'Bike Rental', className: 'bg-purple-100 text-purple-700' },
      chauffeur: { label: 'Car Rental', className: 'bg-blue-100 text-blue-700' },
      bus: { label: 'Bus Rental', className: 'bg-emerald-100 text-emerald-700' },
      car: { label: 'Self-Drive', className: 'bg-orange-100 text-orange-700' },
      truck: { label: 'Truck Rental', className: 'bg-amber-100 text-amber-700' },
      equipment: { label: 'Equipment', className: 'bg-teal-100 text-teal-700' },
      packers: { label: 'Packers & Movers', className: 'bg-pink-100 text-pink-700' },
      luxury: { label: 'Luxury Car', className: 'bg-yellow-100 text-yellow-800' },
    };
    return badges[type] || { label: type, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
          <p className="text-gray-600">Verify customer payments to confirm bookings</p>
        </div>
        <Button onClick={fetchPayments} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'all'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Clock className="w-4 h-4" />
          All Pending ({payments.length})
        </button>
        <button
          onClick={() => setFilter('bike')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'bike'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Bike className="w-4 h-4" />
          Bike Rentals
        </button>
        <button
          onClick={() => setFilter('chauffeur')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'chauffeur'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Car className="w-4 h-4" />
          Car Rental
        </button>
        <button
          onClick={() => setFilter('car')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'car'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <CarFront className="w-4 h-4" />
          Self-Drive
        </button>
        <button
          onClick={() => setFilter('bus')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'bus'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Bus className="w-4 h-4" />
          Bus Rentals
        </button>
        <button
          onClick={() => setFilter('truck')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'truck'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Truck className="w-4 h-4" />
          Truck Rentals
        </button>
        <button
          onClick={() => setFilter('equipment')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'equipment'
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <CreditCard className="w-4 h-4" />
          Equipment
        </button>
        <button
          onClick={() => setFilter('packers')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'packers'
              ? 'bg-pink-100 text-pink-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Package className="w-4 h-4" />
          Packers & Movers
        </button>
        <button
          onClick={() => setFilter('luxury')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap flex-shrink-0 flex items-center gap-2',
            filter === 'luxury'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Crown className="w-4 h-4" />
          Luxury Car
        </button>
      </div>

      {/* Payments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payments to verify</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => {
            const badge = getBookingTypeBadge(payment.bookingType);
            return (
              <div
                key={payment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {payment.bookingNumber}
                      </span>
                      <span className={cn('text-xs px-2 py-1 rounded font-medium', badge.className)}>
                        {badge.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(payment.advancePaymentDate || payment.updatedAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium text-gray-900">{payment.customerName}</p>
                        <p className="text-gray-600">{payment.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Service</p>
                        <p className="font-medium text-gray-900">{payment.serviceType}</p>
                        <p className="text-gray-600">{payment.vehicleName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{payment.location}</p>
                        <p className="text-gray-600">
                          {payment.pickupDate && new Date(payment.pickupDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-bold text-green-600">₹{payment.advanceAmount?.toLocaleString() || payment.grandTotal?.toLocaleString()}</p>
                        <p className="text-gray-600">Total: ₹{payment.grandTotal?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Transaction Ref</p>
                        <p className="font-mono font-medium text-gray-900">{payment.advancePaymentRef || 'N/A'}</p>
                      </div>
                      {payment.paymentMethod && (
                        <div>
                          <p className="text-sm text-gray-500">Method</p>
                          <p className="text-gray-900">{payment.paymentMethod}</p>
                        </div>
                      )}
                      {payment.advancePaymentProof && (
                        <div>
                          <a
                            href={payment.advancePaymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Payment Proof
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2">
                    <Button
                      onClick={() => setSelectedPayment(payment)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setVerifyNotes('');
                      }}
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verify Payment</h2>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Booking</p>
                    <p className="font-mono font-bold">{selectedPayment.bookingNumber}</p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded font-medium',
                    getBookingTypeBadge(selectedPayment.bookingType).className
                  )}>
                    {getBookingTypeBadge(selectedPayment.bookingType).label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-green-600">₹{(selectedPayment.advanceAmount || selectedPayment.grandTotal)?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Transaction Ref</p>
                  <p className="font-mono text-sm break-all">{selectedPayment.advancePaymentRef || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedPayment.customerName}</p>
                <p className="text-sm text-gray-600">{selectedPayment.customerPhone}</p>
              </div>
              {selectedPayment.advancePaymentProof && (
                <a
                  href={selectedPayment.advancePaymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-50 rounded-lg p-4 text-blue-600 hover:bg-blue-100 transition"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Payment Proof
                </a>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Any notes about this payment..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedPayment(null);
                  setVerifyNotes('');
                }}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleVerify('reject')}
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                disabled={isVerifying}
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
              </Button>
              <Button
                onClick={() => handleVerify('verify')}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : selectedPayment.bookingType === 'bus' || selectedPayment.bookingType === 'truck' || selectedPayment.bookingType === 'packers' || selectedPayment.bookingType === 'equipment' || selectedPayment.bookingType === 'luxury' ? (
                  'Verify Payment'
                ) : (
                  'Verify & Broadcast'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
