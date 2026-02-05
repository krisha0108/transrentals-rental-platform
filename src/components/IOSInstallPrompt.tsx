'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Check if already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('ios-install-dismissed') === 'true';

    if (isIOS && !isStandalone && !wasDismissed && !dismissed) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Don't set dismissed to true, so it can show again later
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md m-4 mb-safe bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* App Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#09B368] to-[#078A52] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Install TransRentals App
          </h3>

          {/* Description */}
          <p className="text-center text-gray-600 mb-6">
            Get instant access to vehicle rentals with our app. Works offline and loads faster!
          </p>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#09B368] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Tap the Share button</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-1 bg-blue-500 rounded flex items-center justify-center">
                    <Share className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">at the bottom of your screen</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#09B368] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Select "Add to Home Screen"</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="px-2 py-1 bg-gray-200 rounded flex items-center justify-center">
                    <Plus className="w-4 h-4 text-gray-700" />
                  </div>
                  <span className="text-xs text-gray-500">from the menu</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-[#09B368] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Tap "Add" to confirm</p>
                <span className="text-xs text-gray-500">The app will appear on your home screen</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleRemindLater}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#09B368] to-[#078A52] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              Got it!
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-4 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Don't show again
            </button>
          </div>
        </div>

        {/* Bottom safe area for iPhone notch */}
        <div className="h-safe" />
      </div>
    </div>
  );
}
