'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/analytics/web-vitals-tracker';

/**
 * Web Vitals Initializer Component
 *
 * Add this to your root layout to automatically track Core Web Vitals
 * across your entire application.
 *
 * Usage in layout.tsx:
 * import WebVitalsInitializer from '@/components/analytics/WebVitalsInitializer';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <WebVitalsInitializer />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */
export default function WebVitalsInitializer() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals();
  }, []);

  // This component renders nothing
  return null;
}
