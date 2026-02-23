'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CreditCard, CheckCircle, XCircle, AlertCircle, RefreshCw, Lock, Shield } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type BookingType = 'bike' | 'car' | 'self-drive' | 'truck' | 'bus' | 'packers' | 'equipment' | 'luxury' | 'chauffeur';

interface RazorpayPaymentProps {
  bookingId: string;
  bookingType: BookingType;
  onSuccess: (data: PaymentSuccessData) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  autoOpen?: boolean;
}

interface PaymentSuccessData {
  bookingId: string;
  bookingNumber: string;
  transactionId: string;
  amount: number;
}

type PaymentStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'checking' | 'success' | 'error';

export function RazorpayPayment({
  bookingId,
  bookingType,
  onSuccess,
  onError,
  onCancel,
  autoOpen = false,
}: RazorpayPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Refs to avoid stale closure issues
  const handlerFiredRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  // Load Razorpay script
  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => {
      setError('Failed to load payment gateway');
      setStatus('error');
    };
    document.body.appendChild(script);
  }, []);

  // Poll Razorpay to check if order was paid (for async UPI case)
  const pollOrderStatus = useCallback(
    (orderId: string) => {
      const maxAttempts = 12; // 12 × 3s = 36 seconds

      const check = async () => {
        pollAttemptsRef.current += 1;
        try {
          const res = await fetch(
            `/api/payments/check-order?orderId=${orderId}&bookingId=${bookingId}&bookingType=${bookingType}`
          );
          const data = await res.json();

          if (data.isPaid && data.booking) {
            setStatus('success');
            onSuccess({
              bookingId: data.booking.id,
              bookingNumber: data.booking.bookingNumber,
              transactionId: data.booking.transactionId ?? data.paymentId,
              amount: data.booking.paidAmount,
            });
            return;
          }

          if (pollAttemptsRef.current < maxAttempts) {
            pollTimerRef.current = setTimeout(check, 3000);
          } else {
            // Polling timed out — show ready state with message
            setError('Payment not detected yet. If you completed the payment, please wait a moment and try again.');
            setStatus('ready');
          }
        } catch {
          if (pollAttemptsRef.current < maxAttempts) {
            pollTimerRef.current = setTimeout(check, 3000);
          } else {
            setStatus('ready');
          }
        }
      };

      pollTimerRef.current = setTimeout(check, 3000); // First check after 3s
    },
    [bookingId, bookingType, onSuccess]
  );

  // Create order
  const createOrder = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, bookingType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Previous order was already paid — recover immediately
      if (data.alreadyPaid && data.booking) {
        setStatus('success');
        onSuccess({
          bookingId: data.booking.id,
          bookingNumber: data.booking.bookingNumber,
          transactionId: data.booking.transactionId ?? '',
          amount: data.booking.paidAmount,
        });
        return;
      }

      setOrderData(data);
      setStatus('ready');

      if (autoOpen) {
        openPaymentModal(data);
      }
    } catch (err: any) {
      console.error('[Razorpay] Create order error:', err);
      setError(err.message || 'Failed to create payment order');
      setStatus('error');
      onError(err.message || 'Failed to create payment order');
    }
  }, [bookingId, bookingType, autoOpen, onError]);

  // Open payment modal
  const openPaymentModal = useCallback(
    (data: any = orderData) => {
      if (!data || !window.Razorpay) {
        setError('Payment gateway not ready. Please refresh the page.');
        setStatus('error');
        return;
      }

      handlerFiredRef.current = false;
      pollAttemptsRef.current = 0;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

      setStatus('processing');

      const options = {
        key: data.razorpayConfig.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: data.razorpayConfig.name,
        description: data.razorpayConfig.description,
        order_id: data.order.id,

        handler: async function (response: any) {
          // Mark that handler fired — suppress polling if it starts
          handlerFiredRef.current = true;
          if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
                bookingType,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            setStatus('success');
            onSuccess({
              bookingId: verifyData.booking.id,
              bookingNumber: verifyData.booking.bookingNumber,
              transactionId: verifyData.booking.transactionId,
              amount: verifyData.booking.paidAmount,
            });
          } catch (err: any) {
            console.error('[Razorpay] Verification error:', err);
            // Verification failed — try polling as fallback
            setError(err.message || 'Verification failed, checking payment status...');
            pollAttemptsRef.current = 0;
            pollOrderStatus(data.order.id);
            setStatus('checking');
          }
        },

        prefill: data.razorpayConfig.prefill,

        modal: {
          ondismiss: function () {
            // DON'T switch to manual mode here — handler may still be in-flight
            // (especially for UPI where payment is async)
            if (!handlerFiredRef.current) {
              // Handler hasn't fired yet — start polling to check order status
              pollAttemptsRef.current = 0;
              setStatus('checking');
              pollOrderStatus(data.order.id);
            }
            // If handler already fired, status is already being set by handler
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('[Razorpay] Payment failed:', response.error);
        handlerFiredRef.current = true; // Suppress polling
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        setError(response.error.description || 'Payment failed');
        setStatus('error');
        onError(response.error.description || 'Payment failed');
      });

      razorpay.open();
    },
    [orderData, bookingId, bookingType, onSuccess, onError, pollOrderStatus]
  );

  // Auto-create order on mount
  useEffect(() => {
    if (bookingId && status === 'idle') {
      createOrder();
    }
  }, [bookingId, status, createOrder]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
        <p className="text-gray-500 text-sm">Preparing payment...</p>
      </div>
    );
  }

  if (status === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
        <p className="text-gray-800 font-medium text-sm">Verifying your payment...</p>
        <p className="text-gray-400 text-xs text-center max-w-xs">
          UPI payments may take a moment to confirm. Please wait.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-6 gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-gray-900 font-semibold text-sm">Payment Failed</p>
          <p className="text-gray-500 text-xs mt-1 max-w-xs">{error}</p>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={createOrder}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => onCancel?.()}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition"
          >
            Manual Pay
          </button>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
        <p className="text-gray-800 font-medium text-sm">Processing payment...</p>
        <p className="text-gray-400 text-xs">Please complete payment in the popup window</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-emerald-700 font-semibold">Payment Successful!</p>
        <p className="text-gray-500 text-sm">Your booking is confirmed.</p>
      </div>
    );
  }

  // ─── Ready state ────────────────────────────────────────────────────────────
  const displayAmount = orderData
    ? (orderData.booking.advanceAmount ?? orderData.booking.grandTotal ?? 0)
    : 0;
  const vehicleName = orderData?.booking?.vehicleName;

  return (
    <div className="px-5 py-6">
      {/* Warning if polling failed previously */}
      {error && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-center">
          {error}
        </div>
      )}

      {/* Amount display */}
      {orderData && (
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Advance Payment</p>
          <p className="text-5xl font-bold text-gray-900 tracking-tight">
            ₹{displayAmount.toLocaleString('en-IN')}
          </p>
          {vehicleName && (
            <p className="text-emerald-600 font-medium text-sm mt-2">{vehicleName}</p>
          )}
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={() => openPaymentModal()}
        className="w-full flex items-center justify-center gap-2.5 py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-semibold text-base transition-all shadow-lg shadow-emerald-100"
      >
        <Lock className="w-4 h-4" />
        Pay Securely
      </button>

      {/* Payment methods */}
      <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
        {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
          <span
            key={m}
            className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1"
          >
            {m}
          </span>
        ))}
      </div>

      {/* Razorpay badge */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-gray-400 text-xs">
        <Shield className="w-3 h-3" />
        <span>100% secure · Powered by Razorpay</span>
      </div>
    </div>
  );
}

// Simple payment button component
export function PaymentButton({
  bookingId,
  bookingType = 'bike',
  amount,
  onSuccess,
  onError,
  className = '',
}: {
  bookingId: string;
  bookingType?: BookingType;
  amount: number;
  onSuccess: (data: PaymentSuccessData) => void;
  onError: (error: string) => void;
  className?: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, bookingType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      const options = {
        key: data.razorpayConfig.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: data.razorpayConfig.name,
        description: data.razorpayConfig.description,
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
                bookingType,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              throw new Error(verifyData.error);
            }

            onSuccess({
              bookingId: verifyData.booking.id,
              bookingNumber: verifyData.booking.bookingNumber,
              transactionId: verifyData.booking.transactionId,
              amount: verifyData.booking.paidAmount,
            });
          } catch (err: any) {
            onError(err.message);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: data.razorpayConfig.prefill,
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        onError(response.error.description);
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (err: any) {
      onError(err.message);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className={`flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Pay ₹{amount.toLocaleString()}
        </>
      )}
    </button>
  );
}
