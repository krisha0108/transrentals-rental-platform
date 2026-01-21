'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  bookingId: string;
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

type PaymentStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'success' | 'error';

export function RazorpayPayment({
  bookingId,
  onSuccess,
  onError,
  onCancel,
  autoOpen = false,
}: RazorpayPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('[Razorpay] Script loaded');
    };
    script.onerror = () => {
      setError('Failed to load payment gateway');
      setStatus('error');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Create order
  const createOrder = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
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
  }, [bookingId, autoOpen, onError]);

  // Open payment modal
  const openPaymentModal = useCallback(
    (data: any = orderData) => {
      if (!data || !window.Razorpay) {
        setError('Payment gateway not ready');
        return;
      }

      setStatus('processing');

      const options = {
        key: data.razorpayConfig.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: data.razorpayConfig.name,
        description: data.razorpayConfig.description,
        image: data.razorpayConfig.image,
        order_id: data.order.id,
        handler: async function (response: any) {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
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
            setError(err.message || 'Payment verification failed');
            setStatus('error');
            onError(err.message || 'Payment verification failed');
          }
        },
        prefill: data.razorpayConfig.prefill,
        theme: data.razorpayConfig.theme,
        modal: {
          ondismiss: function () {
            setStatus('ready');
            onCancel?.();
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('[Razorpay] Payment failed:', response.error);
        setError(response.error.description || 'Payment failed');
        setStatus('error');
        onError(response.error.description || 'Payment failed');
      });

      razorpay.open();
    },
    [orderData, bookingId, onSuccess, onError, onCancel]
  );

  // Auto-create order on mount
  useEffect(() => {
    if (bookingId && status === 'idle') {
      createOrder();
    }
  }, [bookingId, status, createOrder]);

  // Render based on status
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Preparing payment...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600 font-medium">Payment Error</p>
        <p className="text-gray-600 text-sm text-center">{error}</p>
        <button
          onClick={createOrder}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-green-600 font-medium text-lg">Payment Successful!</p>
        <p className="text-gray-600 text-sm">Your booking is confirmed.</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Processing payment...</p>
        <p className="text-gray-400 text-sm">Please complete the payment in the popup</p>
      </div>
    );
  }

  // Ready state - show pay button
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {orderData && (
        <div className="text-center mb-4">
          <p className="text-gray-600 text-sm">Amount to pay</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{orderData.booking.grandTotal.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {orderData.booking.vehicleName} • {orderData.booking.totalDays || ''} day(s)
          </p>
        </div>
      )}

      <button
        onClick={() => openPaymentModal()}
        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-lg"
      >
        <CreditCard className="w-5 h-5" />
        Pay Now
      </button>

      <div className="flex items-center gap-2 text-gray-400 text-xs mt-4">
        <AlertCircle className="w-4 h-4" />
        <span>Secured by Razorpay</span>
      </div>
    </div>
  );
}

// Simple payment button component
export function PaymentButton({
  bookingId,
  amount,
  onSuccess,
  onError,
  className = '',
}: {
  bookingId: string;
  amount: number;
  onSuccess: (data: PaymentSuccessData) => void;
  onError: (error: string) => void;
  className?: string;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Load Razorpay if not already loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Open Razorpay
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
        theme: data.razorpayConfig.theme,
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
