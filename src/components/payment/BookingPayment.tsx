'use client';

import { useState } from 'react';
import { CreditCard, Shield } from 'lucide-react';
import { RazorpayPayment } from './RazorpayPayment';
import { PaymentConfirmation } from '@/components/bike/PaymentConfirmation';

type BookingType = 'bike' | 'car' | 'self-drive' | 'truck' | 'bus' | 'packers' | 'equipment' | 'luxury' | 'chauffeur' | 'wander_quote';

interface BookingPaymentProps {
  bookingId: string;
  bookingType: BookingType;
  amount: number;
  bookingNumber: string;
  serviceSlug?: string;
  onSuccess?: () => void;
  /**
   * When true, skips the outer card chrome (white wrapper + emerald header).
   * Use when the parent already provides its own card/header — avoids duplicate
   * "Complete Your Booking" labels and lets the widget sit flush.
   */
  embedded?: boolean;
}

export function BookingPayment({
  bookingId,
  bookingType,
  amount,
  bookingNumber,
  serviceSlug,
  onSuccess,
  embedded = false,
}: BookingPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'manual'>('razorpay');

  if (paymentMethod === 'manual') {
    if (embedded) {
      return (
        <>
          <PaymentConfirmation
            bookingId={bookingId}
            bookingNumber={bookingNumber}
            amount={amount}
            serviceSlug={serviceSlug}
            onPaymentConfirmed={onSuccess}
          />
          <button
            onClick={() => setPaymentMethod('razorpay')}
            className="w-full text-xs text-emerald-600 hover:text-emerald-700 font-semibold text-center pt-3 transition"
          >
            ← Back to online payment
          </button>
        </>
      );
    }
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Manual Payment</p>
              <p className="text-gray-300 text-xs">UPI / Bank Transfer</p>
            </div>
          </div>
        </div>

        <PaymentConfirmation
          bookingId={bookingId}
          bookingNumber={bookingNumber}
          amount={amount}
          serviceSlug={serviceSlug}
          onPaymentConfirmed={onSuccess}
        />

        <div className="px-5 pb-4 border-t border-gray-100 pt-3">
          <button
            onClick={() => setPaymentMethod('razorpay')}
            className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium text-center py-1 transition"
          >
            ← Back to online payment
          </button>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <>
        <RazorpayPayment
          bookingId={bookingId}
          bookingType={bookingType}
          onSuccess={() => onSuccess?.()}
          onError={() => {/* errors are shown inside RazorpayPayment with retry/manual options */}}
          onCancel={() => setPaymentMethod('manual')}
          compact
        />
        <button
          onClick={() => setPaymentMethod('manual')}
          className="w-full text-[10px] text-gray-400 hover:text-gray-600 text-center pt-2 transition"
        >
          Having trouble? Pay via UPI / Bank Transfer
        </button>
      </>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Emerald header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Complete Your Booking</p>
            <p className="text-emerald-100 text-xs">Pay advance to confirm</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
            <Shield className="w-3 h-3" />
            <span className="text-xs font-medium">Secure</span>
          </div>
        </div>
      </div>

      {/* Razorpay payment content */}
      <RazorpayPayment
        bookingId={bookingId}
        bookingType={bookingType}
        onSuccess={() => onSuccess?.()}
        onError={() => {/* errors are shown inside RazorpayPayment with retry/manual options */}}
        onCancel={() => setPaymentMethod('manual')}
      />

      {/* Having trouble */}
      <div className="px-5 pb-4 -mt-1">
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={() => setPaymentMethod('manual')}
            className="w-full text-xs text-gray-400 hover:text-gray-600 text-center py-1 transition"
          >
            Having trouble? Pay via UPI / Bank Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
