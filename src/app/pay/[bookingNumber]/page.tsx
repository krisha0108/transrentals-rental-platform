'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Copy,
  Check,
  Building2,
  Smartphone,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  Car,
  Calendar,
  MapPin,
  AlertCircle,
  Shield,
  IndianRupee,
  QrCode,
} from 'lucide-react';

interface PaymentSettings {
  upiId: string;
  upiName: string;
  qrCode: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankHolder: string;
  bankBranch: string;
  instructions: string;
  advancePercent: number;
}

interface BookingDetails {
  id: string;
  bookingNumber: string;
  tripType: string;
  carCategory: string;
  carCategoryName?: string;
  pickupCity: string;
  dropCity: string;
  pickupDate: string;
  pickupTime: string;
  grandTotal: number;
  status: string;
  customerName: string;
  paymentStatus?: string;
  bookingType: 'car' | 'chauffeur';
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.bookingNumber as string;

  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [bookingNumber]);

  const fetchData = async () => {
    try {
      let bookingData = null;
      let bookingType: 'car' | 'chauffeur' = 'chauffeur';

      // Support both CR (old) and CB (new) prefixes for backward compatibility
      if (bookingNumber.startsWith('CR-') || bookingNumber.startsWith('CB-')) {
        const carRentalRes = await fetch(`/api/car-rental/bookings/${bookingNumber}`);
        const carRentalData = await carRentalRes.json();
        if (carRentalData.success) {
          bookingData = carRentalData;
          bookingType = 'chauffeur';
        }
      }

      if (!bookingData?.success) {
        setError('Booking not found');
        setIsLoading(false);
        return;
      }

      setBooking({ ...bookingData.booking, bookingType });

      const settingsRes = await fetch('/api/payment-settings');
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setPaymentSettings(settingsData.settings);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load payment details');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const advanceAmount = useMemo(() => {
    if (!booking || !paymentSettings) return 0;
    return Math.round((booking.grandTotal * paymentSettings.advancePercent) / 100);
  }, [booking, paymentSettings]);

  // Generate UPI deep link with amount
  const upiDeepLink = useMemo(() => {
    if (!paymentSettings?.upiId || !advanceAmount) return '';
    const params = new URLSearchParams({
      pa: paymentSettings.upiId,
      pn: paymentSettings.upiName || 'koshtimehul02@okhdfcbank',
      am: advanceAmount.toString(),
      cu: 'INR',
      tn: `Payment for ${bookingNumber}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [paymentSettings, advanceAmount, bookingNumber]);

  // Generate QR code URL using free API
  const qrCodeUrl = useMemo(() => {
    if (!upiDeepLink) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiDeepLink)}`;
  }, [upiDeepLink]);

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      setError('Please enter transaction ID or UTR number');
      return;
    }

    if (!booking) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Support both CR (old) and CB (new) prefixes for backward compatibility
      let apiUrl: string;
      if (bookingNumber.startsWith('CR-') || bookingNumber.startsWith('CB-')) {
        apiUrl = `/api/car-rental/bookings/${bookingNumber}/payment`;
      } else {
        apiUrl = `/api/car-bookings/${bookingNumber}/payment`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transactionId.trim(),
          paymentMethod,
          amount: advanceAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit payment');
      }
    } catch (err) {
      setError('Failed to submit payment details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <Link href="/" className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Submitted!</h1>
          <p className="text-gray-600 text-sm mb-4">
            We&apos;ve received your payment details. Verification in progress.
          </p>
          <div className="bg-amber-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2 text-amber-700 text-sm">
              <Clock className="w-4 h-4" />
              <span>Usually takes 15-30 minutes</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Booking: <strong>{bookingNumber}</strong></p>
          <Link
            href={`/customer/car-rental-bookings/${bookingNumber}`}
            className="block w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            View Booking Status
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center h-14">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="ml-2">
              <h1 className="font-semibold text-gray-900 text-sm">Complete Payment</h1>
              <p className="text-xs text-gray-500">#{bookingNumber}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-emerald-600">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-medium">Secure</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Amount Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs">Amount to Pay</p>
              <p className="text-2xl font-bold flex items-center">
                <IndianRupee className="w-5 h-5" />
                {advanceAmount.toLocaleString()}
              </p>
              <p className="text-emerald-200 text-xs mt-1">
                {paymentSettings?.advancePercent}% advance of ₹{booking?.grandTotal.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-xs">Booking</p>
              <p className="font-medium text-sm">{booking?.carCategoryName || booking?.carCategory}</p>
              <p className="text-emerald-200 text-xs">
                {booking?.pickupCity}{booking?.dropCity ? ` → ${booking.dropCity}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="bg-white rounded-xl shadow-sm border p-1 flex gap-1">
          <button
            onClick={() => setPaymentMethod('upi')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              paymentMethod === 'upi'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            UPI / QR
          </button>
          <button
            onClick={() => setPaymentMethod('bank')}
            className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${
              paymentMethod === 'bank'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Bank Transfer
          </button>
        </div>

        {/* UPI Payment */}
        {paymentMethod === 'upi' && paymentSettings && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* QR Code Section */}
            <div className="p-4 border-b bg-gradient-to-b from-gray-50 to-white">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3">Scan QR code to pay ₹{advanceAmount.toLocaleString()}</p>
                <div className="inline-block bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="UPI QR Code"
                      width={160}
                      height={160}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                      <QrCode className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Works with GPay, PhonePe, Paytm & all UPI apps</p>
              </div>
            </div>

            {/* UPI ID Section */}
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-2">Or pay using UPI ID</p>
              <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-3">
                <div>
                  <p className="font-mono font-semibold text-emerald-800 text-sm">{paymentSettings.upiId}</p>
                  <p className="text-xs text-emerald-600">{paymentSettings.upiName}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentSettings.upiId, 'upi')}
                  className="p-2 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition"
                >
                  {copied === 'upi' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              </div>

              {/* Pay Now Button (opens UPI app) */}
              <a
                href={upiDeepLink}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm"
              >
                <Smartphone className="w-4 h-4" />
                Open UPI App
              </a>
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {paymentMethod === 'bank' && paymentSettings && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-500 mb-3">Transfer to bank account</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Bank Name</p>
                  <p className="font-medium text-gray-900 text-sm">{paymentSettings.bankName}</p>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Account Number</p>
                  <p className="font-mono font-medium text-gray-900 text-sm">{paymentSettings.bankAccount}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentSettings.bankAccount, 'account')}
                  className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {copied === 'account' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                </button>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">IFSC Code</p>
                  <p className="font-mono font-medium text-gray-900 text-sm">{paymentSettings.bankIfsc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentSettings.bankIfsc, 'ifsc')}
                  className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {copied === 'ifsc' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                </button>
              </div>
              <div className="py-2 border-b">
                <p className="text-[10px] text-gray-400 uppercase">Account Holder</p>
                <p className="font-medium text-gray-900 text-sm">{paymentSettings.bankHolder}</p>
              </div>
              {paymentSettings.bankBranch && (
                <div className="py-2">
                  <p className="text-[10px] text-gray-400 uppercase">Branch</p>
                  <p className="text-gray-700 text-sm">{paymentSettings.bankBranch}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transaction ID Input */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="font-medium text-gray-900 text-sm mb-1">After Payment</p>
          <p className="text-xs text-gray-500 mb-3">
            Enter UTR/Transaction ID to confirm your payment
          </p>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter Transaction ID / UTR Number"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />

          {error && (
            <p className="text-red-600 text-xs mt-2">{error}</p>
          )}

          <button
            onClick={handleSubmitPayment}
            disabled={isSubmitting || !transactionId.trim()}
            className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Payment
              </>
            )}
          </button>
        </div>

        {/* Booking Details (Collapsed) */}
        {booking && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-xs text-gray-400 uppercase mb-2">Booking Details</p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Vehicle</p>
                <p className="font-medium text-gray-900">{booking.carCategoryName || booking.carCategory}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(booking.pickupDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{booking.pickupTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {paymentSettings?.instructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-xs">{paymentSettings.instructions}</p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Shield className="w-3 h-3" />
            <span>Secure Payment</span>
          </div>
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="text-gray-400 text-xs">24/7 Support</div>
        </div>
      </div>
    </div>
  );
}
