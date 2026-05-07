'use client';

import { useState } from 'react';
import { Phone, Smartphone, X } from 'lucide-react';

interface VendorCallButtonProps {
  phone: string;
  bookingType: string;
  bookingId: string;
  size?: 'sm' | 'md';
  variant?: 'emerald' | 'blue' | 'gray';
}

export default function VendorCallButton({
  phone,
  bookingType,
  bookingId,
  size = 'sm',
  variant = 'emerald',
}: VendorCallButtonProps) {
  const [showDesktopModal, setShowDesktopModal] = useState(false);
  const [logging, setLogging] = useState(false);

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  };

  const logCall = async () => {
    try {
      setLogging(true);
      await fetch('/api/vendor/call-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingType, bookingId, source: 'web' }),
      });
    } catch {
      // non-blocking — don't block the call if logging fails
    } finally {
      setLogging(false);
    }
  };

  const handleClick = async () => {
    // Log click regardless of device (fire and forget)
    logCall();

    if (isMobile()) {
      window.location.href = `tel:${phone}`;
    } else {
      setShowDesktopModal(true);
    }
  };

  const variantStyles = {
    emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-[#FAFAFA] hover:bg-[#F3F4F6] text-[#6B7280] border-[#EEEEEE]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2 rounded-xl gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={logging}
        className={`inline-flex items-center font-semibold border transition-all ${variantStyles[variant]} ${sizeStyles[size]}`}
      >
        <Phone className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Call
      </button>

      {/* Desktop modal */}
      {showDesktopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowDesktopModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">Use Vendor App to Call</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Customer calls can only be made from the Vendor mobile app. Please open the app on your phone to call this customer.
                </p>
              </div>

              <button
                onClick={() => setShowDesktopModal(false)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
