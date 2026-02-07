/**
 * App Links Configuration
 *
 * Update these links with your actual app store URLs and deep link schemes
 */

export const APP_LINKS = {
  // Android Configuration
  android: {
    // Deep link scheme to open the app
    deepLink: 'transrentals://open',

    // Play Store link for customer app
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.transrentals.customer',

    // Package ID for intent-based deep linking (more reliable)
    packageId: 'com.transrentals.customer',

    // Intent URL (alternative to deep link)
    intentUrl: 'intent://open#Intent;scheme=transrentals;package=com.transrentals.customer;end',
  },

  // iOS Configuration (PWA - Progressive Web App)
  ios: {
    // iOS uses PWA (Web App) instead of native app
    // Users will be guided to install via "Add to Home Screen" in Safari
    // PWA config is in public/manifest.json
    isPWA: true,

    // PWA deep link (for future use if needed)
    deepLink: 'transrentals://open',

    // Universal Link (for PWA)
    universalLink: 'https://transrentals.in',
  },

  // Fallback Configuration
  fallback: {
    // If platform is not detected or app links fail
    webUrl: 'https://transrentals.in',
  },
};

/**
 * App Features for Marketing
 */
export const APP_FEATURES = [
  {
    icon: '✓',
    text: 'Faster bookings & instant confirmations',
  },
  {
    icon: '✓',
    text: 'Real-time tracking & notifications',
  },
  {
    icon: '✓',
    text: 'Exclusive app-only deals & discounts',
  },
  {
    icon: '✓',
    text: 'Works offline - Save your bookings',
  },
];

/**
 * App Metadata
 */
export const APP_METADATA = {
  name: 'TransRentals',
  shortName: 'TransRentals',
  description: 'Get the best experience with our mobile app',
  rating: '4.8',
  downloads: '10K+',
  price: 'FREE',
};
