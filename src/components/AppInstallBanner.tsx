'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, ExternalLink } from 'lucide-react';
import { APP_LINKS, APP_FEATURES, APP_METADATA } from '@/config/app-links';

export default function AppInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // Check if iOS PWA is already installed (running in standalone mode)
    const isIOSPWAInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true;

    if (isAndroid) {
      setPlatform('android');
    } else if (isIOS) {
      // Don't show banner if iOS PWA is already installed
      if (isIOSPWAInstalled) {
        return;
      }
      setPlatform('ios');
    } else {
      setPlatform('other');
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem('app-banner-dismissed');
    const lastDismissed = dismissed ? parseInt(dismissed) : 0;
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Don't show banner for desktop or if dismissed recently
    if (platform === 'other' || (Date.now() - lastDismissed < oneDayInMs)) {
      return;
    }

    // Show banner after 2-3 seconds
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [platform]);

  const handleContinueInWeb = () => {
    setShowBanner(false);
    // Store dismissal with timestamp
    localStorage.setItem('app-banner-dismissed', Date.now().toString());
  };

  const handleOpenInApp = async () => {
    setIsLoading(true);

    try {
      if (platform === 'android') {
        // Android: Try intent URL first (more reliable), then deep link
        const intentUrl = APP_LINKS.android.intentUrl;
        const deepLink = APP_LINKS.android.deepLink;
        const playStoreLink = APP_LINKS.android.playStoreUrl;

        // Try intent URL first (works better on Android)
        try {
          window.location.href = intentUrl;
          // If intent URL works, app will open. If not, it redirects to Play Store
        } catch {
          // Fallback to deep link method
          const appOpened = await tryOpenApp(deepLink, playStoreLink);
          if (!appOpened) {
            window.location.href = playStoreLink;
          }
        }
      } else if (platform === 'ios') {
        // iOS: Show PWA install guide instead of App Store
        // Close main banner and trigger iOS install prompt
        setShowBanner(false);
        setShowIOSInstallGuide(true);

        // Trigger the IOSInstallPrompt to show
        // The IOSInstallPrompt component will automatically show installation steps
        localStorage.removeItem('ios-install-dismissed'); // Reset so it can show again
      }
    } catch (error) {
      console.error('Error opening app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if app is installed and open it
  const tryOpenApp = (deepLink: string, storeLink: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let appOpened = false;
      const startTime = Date.now();

      // Try to open the app
      window.location.href = deepLink;

      // Check if app was opened
      const checkInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;

        // If page is still visible after 2 seconds, app probably didn't open
        if (elapsedTime > 2000) {
          clearInterval(checkInterval);
          if (!document.hidden && !appOpened) {
            resolve(false); // App not installed
          }
        }
      }, 500);

      // If page becomes hidden, app likely opened
      const visibilityHandler = () => {
        if (document.hidden) {
          appOpened = true;
          clearInterval(checkInterval);
          resolve(true); // App opened
        }
      };

      document.addEventListener('visibilitychange', visibilityHandler);

      // Cleanup after 3 seconds
      setTimeout(() => {
        document.removeEventListener('visibilitychange', visibilityHandler);
        clearInterval(checkInterval);
        if (!appOpened) {
          resolve(false);
        }
      }, 3000);
    });
  };

  if (!showBanner || platform === 'other') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-white rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-500 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleContinueInWeb}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* App Icon and Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-[#09B368] to-[#078A52] rounded-2xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-9 h-9 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {APP_METADATA.name} App
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {APP_METADATA.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★★★★★</span>
                  <span>{APP_METADATA.rating}</span>
                </div>
                <span>•</span>
                <span>{APP_METADATA.downloads} Downloads</span>
                <span>•</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                  {APP_METADATA.price}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-4 mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Why use our app?
            </p>
            <div className="space-y-2">
              {APP_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-600 font-bold">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="px-3 py-1.5 bg-gray-100 rounded-full flex items-center gap-2">
              {platform === 'android' ? (
                <>
                  <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.5 11.5 0 00-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C2.92 11.03 1 14.22 1 17.8h22c0-3.58-1.92-6.77-5.4-8.32zM8.06 15.2c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2zm7.88 0c-.66 0-1.2-.54-1.2-1.2s.54-1.2 1.2-1.2 1.2.54 1.2 1.2-.54 1.2-1.2 1.2z"/>
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Android App</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <span className="text-xs font-medium text-gray-700">iOS Web App</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleOpenInApp}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#09B368] to-[#078A52] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-5 h-5" />
                  <span>
                    {platform === 'android' ? 'Open in App' : 'Install Web App'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleContinueInWeb}
              className="w-full py-4 px-6 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-all duration-200"
            >
              Continue in Browser
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-500 mt-4">
            {platform === 'android'
              ? 'Will redirect to Play Store if app is not installed'
              : 'Will show steps to install web app on your home screen'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
