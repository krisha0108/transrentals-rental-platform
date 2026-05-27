'use client';

import dynamic from 'next/dynamic';
import type { LiveMarker } from './LiveMapInner';

export type { LiveMarker };

// react-leaflet touches `window` at import time, so the actual map must never
// render on the server. This wrapper is the single import point — consumers
// use <LiveMap .../> like any component and get the ssr:false behaviour for free.
const LiveMap = dynamic(() => import('./LiveMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[240px] flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
      Loading map…
    </div>
  ),
});

export default LiveMap;
