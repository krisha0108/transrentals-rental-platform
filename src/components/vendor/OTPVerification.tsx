'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OTPVerificationProps {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  customerPhone?: string;
  action: 'start' | 'end';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function OTPVerification({
  bookingId,
  bookingNumber,
  customerName,
  customerPhone,
  action,
  onSuccess,
  onError,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/otp`);
      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds cooldown
        // In development, auto-fill OTP if returned
        if (data.otp) {
          const otpArray = data.otp.split('');
          setOtp(otpArray);
        }
      } else {
        setError(data.error || 'Failed to send OTP');
        onError?.(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      onError?.('Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode, action }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to verify OTP');
        onError?.(data.error || 'Failed to verify OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      onError?.('Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      // Focus last input or next empty
      const nextIndex = Math.min(index + pastedOtp.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 rounded-xl p-6 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800 mb-2">
          {action === 'start' ? 'Trip Started!' : 'Trip Completed!'}
        </h3>
        <p className="text-green-600">
          OTP verified successfully for booking #{bookingNumber}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          <h3 className="font-bold">
            {action === 'start' ? 'Start Trip Verification' : 'End Trip Verification'}
          </h3>
        </div>
        <p className="text-purple-200 text-sm mt-1">Booking #{bookingNumber}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-semibold text-gray-900">{customerName}</p>
          {customerPhone && (
            <p className="text-sm text-gray-600">{customerPhone}</p>
          )}
        </div>

        {!otpSent ? (
          /* Send OTP Section */
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Send OTP to customer&apos;s registered mobile number to {action === 'start' ? 'start' : 'end'} the trip.
            </p>
            <Button
              onClick={handleSendOTP}
              disabled={sending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send OTP to Customer
                </>
              )}
            </Button>
          </div>
        ) : (
          /* OTP Input Section */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-center text-gray-600">
              Enter the 6-digit OTP shared by the customer
            </p>

            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Verify Button */}
            <Button
              onClick={handleVerifyOTP}
              disabled={verifying || otp.join('').length !== 6}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify & {action === 'start' ? 'Start Trip' : 'Complete Trip'}
                </>
              )}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend OTP in {countdown}s
                </p>
              ) : (
                <button
                  onClick={handleSendOTP}
                  disabled={sending}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  Resend OTP
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
